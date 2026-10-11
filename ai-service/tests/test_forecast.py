import numpy as np
import pandas as pd
import pytest
from fastapi import HTTPException

from app.ml.next_day_forecast import (
    ForecastDataError,
    InsufficientHistoryError,
    build_lagged_dataset,
    chronological_split,
    create_forecast,
    majority_baseline,
)


def sample_closes(count=140):
    dates = pd.bdate_range("2025-01-01", periods=count)
    values = [100.0]
    for index in range(1, count):
        values.append(values[-1] * (1 + (0.004 if index % 3 else -0.003)))
    return pd.Series(values, index=dates, name="Close")


def test_lagged_rows_label_the_following_session_and_leave_latest_unlabeled():
    closes = sample_closes(40)
    features, labels, latest = build_lagged_dataset(closes)
    day = features.index[0]
    next_day = closes.index[closes.index.get_loc(day) + 1]
    assert labels.loc[day] == int(closes.loc[next_day] > closes.loc[day])
    assert features.index[-1] == closes.index[-2]
    assert latest.index[0] == closes.index[-1]
    assert closes.index[-1] not in labels.index


def test_lagged_features_at_cutoff_do_not_use_future_closes():
    closes = sample_closes(50)
    cutoff = closes.index[35]
    changed = closes.copy()
    changed.loc[changed.index > cutoff] *= 3.0
    first_features, _, _ = build_lagged_dataset(closes)
    changed_features, _, _ = build_lagged_dataset(changed)
    pd.testing.assert_series_equal(first_features.loc[cutoff], changed_features.loc[cutoff])


def test_chronological_split_keeps_later_observations_in_test():
    features, labels, _ = build_lagged_dataset(sample_closes())
    x_train, y_train, x_test, y_test = chronological_split(features, labels)
    assert x_train.index.is_monotonic_increasing
    assert x_test.index.is_monotonic_increasing
    assert x_train.index[-1] < x_test.index[0]
    assert len(x_train) == int(len(features) * 0.8)
    assert len(y_test) == len(x_test)


def test_majority_baseline_uses_training_majority_on_test_dates():
    result = majority_baseline(pd.Series([0, 0, 0, 1]), pd.Series([0, 1, 0, 1]))
    assert result == {"majorityClass": "lower", "accuracy": 0.5}


def test_insufficient_history_returns_clear_domain_error_before_model_import():
    with pytest.raises(InsufficientHistoryError, match="eligible labeled trading sessions"):
        create_forecast(sample_closes(35), "AAPL")


def test_demo_history_is_rejected():
    with pytest.raises(ForecastDataError, match="demo data is not eligible"):
        create_forecast(sample_closes(), "AAPL", data_source="offline_synthetic_demo", is_demo=True)


def test_forecast_reports_holdout_metrics_and_unfabricated_target_date():
    pytest.importorskip("sklearn")
    result = create_forecast(sample_closes(), "AAPL")
    evaluation = result["evaluation"]
    assert result["status"] == "available"
    assert result["targetDate"] is None
    assert evaluation["testSampleCount"] > 0
    assert len(evaluation["confusionMatrix"]) == 2
    assert len(evaluation["confusionMatrix"][0]) == 2
    assert 0.0 <= evaluation["accuracy"] <= 1.0
    assert 0.0 <= evaluation["precision"] <= 1.0
    assert 0.0 <= evaluation["recall"] <= 1.0
    assert 0.0 <= evaluation["majorityBaseline"]["accuracy"] <= 1.0


def test_provider_failure_is_reported_as_unavailable(monkeypatch):
    import app.api.market as market

    def fail_provider(*_args, **_kwargs):
        raise RuntimeError("Yahoo Finance request failed")

    monkeypatch.setattr(market, "fetch_real_closing_prices", fail_provider)
    with pytest.raises(HTTPException) as exc:
        market.get_next_day_forecast("AAPL", "1y")
    assert exc.value.status_code == 503
    assert "Yahoo Finance" in exc.value.detail


def test_missing_model_dependency_is_reported_as_unavailable(monkeypatch):
    import app.api.market as market

    monkeypatch.setattr(market, "fetch_real_closing_prices", lambda *_args, **_kwargs: sample_closes())
    monkeypatch.setattr(market, "create_forecast", lambda *_args, **_kwargs: (_ for _ in ()).throw(ImportError()))
    with pytest.raises(HTTPException) as exc:
        market.get_next_day_forecast("AAPL", "1y")
    assert exc.value.status_code == 503
    assert "scikit-learn" in exc.value.detail


def test_feature_builder_drops_missing_and_non_finite_values():
    closes = sample_closes(45)
    closes.iloc[25] = np.nan
    features, labels, _ = build_lagged_dataset(closes)
    assert np.isfinite(features.to_numpy()).all()
    assert labels.index.equals(features.index)
    assert closes.index[24] not in labels.index  # Missing next-session close cannot create a bridged label.
