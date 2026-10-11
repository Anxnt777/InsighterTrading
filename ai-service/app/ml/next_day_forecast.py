"""Leakage-conscious next-session direction estimate using historical closes."""

from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd

MIN_LABELED_OBSERVATIONS = 80


class InsufficientHistoryError(ValueError):
    pass


class ForecastDataError(ValueError):
    pass


def build_lagged_dataset(closes: pd.Series) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Build features at close t and labels for close(t+1) > close(t).

    The third returned value contains the latest feature row, whose next-session
    target is naturally unknown and is never included in the labeled dataset.
    """
    close = pd.to_numeric(closes, errors="coerce").sort_index()
    close = close.loc[~close.index.duplicated(keep="last")]
    returns = close.pct_change(fill_method=None)
    feature_rows = pd.DataFrame({
        "return_1d": returns,
        "return_2d": close.pct_change(2),
        "return_5d": close.pct_change(5),
        "return_10d": close.pct_change(10),
        "mean_return_5d": returns.rolling(5).mean(),
        "mean_return_20d": returns.rolling(20).mean(),
        "volatility_5d": returns.rolling(5).std(),
        "volatility_20d": returns.rolling(20).std(),
        "sma_gap_5d": close / close.rolling(5).mean() - 1.0,
        "sma_gap_20d": close / close.rolling(20).mean() - 1.0,
    }, index=close.index).replace([np.inf, -np.inf], np.nan)

    latest_features = feature_rows.dropna()
    next_close = close.shift(-1)
    labeled = latest_features.loc[next_close.reindex(latest_features.index).notna()]
    labels = (next_close.loc[labeled.index] > close.loc[labeled.index]).astype(int)
    return labeled, labels, latest_features.iloc[[-1]] if not latest_features.empty else latest_features


def chronological_split(features: pd.DataFrame, labels: pd.Series):
    """Split oldest 80% for training and newest 20% for testing, without shuffle."""
    split_at = int(len(features) * 0.8)
    if split_at < 1 or split_at >= len(features):
        raise InsufficientHistoryError("At least two labeled observations are required for a chronological split.")
    return (
        features.iloc[:split_at], labels.iloc[:split_at],
        features.iloc[split_at:], labels.iloc[split_at:],
    )


def majority_baseline(y_train: pd.Series, y_test: pd.Series) -> Dict[str, Any]:
    """Evaluate the training majority class against the identical test dates."""
    counts = y_train.value_counts()
    majority_class = int(counts.index[0])
    correct = int((y_test == majority_class).sum())
    return {
        "majorityClass": "higher" if majority_class == 1 else "lower",
        "accuracy": round(correct / len(y_test), 4) if len(y_test) else 0.0,
    }


def create_forecast(
    closes: pd.Series,
    symbol: str,
    data_source: str = "yfinance",
    is_demo: bool = False,
) -> Dict[str, Any]:
    if is_demo or data_source != "yfinance":
        raise ForecastDataError("Forecasts require real Yahoo Finance history; demo data is not eligible.")

    features, labels, latest_features = build_lagged_dataset(closes)
    latest_close_index = pd.to_numeric(closes, errors="coerce").sort_index().last_valid_index()
    if (
        len(features) < MIN_LABELED_OBSERVATIONS
        or latest_features.empty
        or latest_close_index is None
        or latest_features.index[-1] != latest_close_index
    ):
        raise InsufficientHistoryError(
            f"At least {MIN_LABELED_OBSERVATIONS} eligible labeled trading sessions are required; "
            f"received {len(features)}, and the latest completed close must be valid."
        )
    if labels.nunique() < 2:
        raise InsufficientHistoryError("Historical labels contain only one direction class; a forecast cannot be fit.")

    x_train, y_train, x_test, y_test = chronological_split(features, labels)
    if y_train.nunique() < 2:
        raise InsufficientHistoryError("The chronological training period does not contain both direction classes.")

    # Import lazily so feature/data validation remains testable before dependency installation.
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    evaluation_model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42)),
    ])
    evaluation_model.fit(x_train, y_train)
    test_predictions = evaluation_model.predict(x_test)
    matrix = confusion_matrix(y_test, test_predictions, labels=[0, 1]).tolist()
    baseline = majority_baseline(y_train, y_test)

    final_model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42)),
    ])
    final_model.fit(features, labels)
    direction = int(final_model.predict(latest_features)[0])
    positive_index = list(final_model.classes_).index(1)
    probability_higher = float(final_model.predict_proba(latest_features)[0][positive_index])
    close_series = pd.to_numeric(closes, errors="coerce").dropna().sort_index()

    return {
        "status": "available",
        "symbol": symbol.upper(),
        "asOf": pd.Timestamp(latest_features.index[-1]).date().isoformat(),
        "targetDate": None,
        "currentClose": round(float(close_series.loc[latest_features.index[-1]]), 4),
        "predictedDirection": "higher" if direction == 1 else "lower",
        "probabilityHigher": round(probability_higher, 4),
        "model": "LogisticRegression",
        "trainingObservations": len(features),
        "evaluation": {
            "split": "chronological 80/20",
            "testSampleCount": len(y_test),
            "accuracy": round(float(accuracy_score(y_test, test_predictions)), 4),
            "precision": round(float(precision_score(y_test, test_predictions, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, test_predictions, zero_division=0)), 4),
            "confusionMatrix": matrix,
            "confusionMatrixOrder": "[[true lower/pred lower, true lower/pred higher], [true higher/pred lower, true higher/pred higher]]",
            "majorityBaseline": baseline,
        },
        "dataSource": "yfinance",
        "statusMessage": None,
        "disclaimer": "Experimental direction estimate for academic research only; not financial advice or a guaranteed prediction.",
    }
