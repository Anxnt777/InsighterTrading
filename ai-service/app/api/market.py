from fastapi import APIRouter, HTTPException, Query
from app.data.yfinance_client import fetch_real_closing_prices, fetch_stock_history
from app.ml.next_day_forecast import (
    ForecastDataError,
    InsufficientHistoryError,
    create_forecast,
)

router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])


@router.get("/history")
def get_historical_market_data(
    ticker: str = Query(..., description="Stock ticker symbol (e.g. AAPL, MSFT, TSLA)"),
    period: str = Query("1y", description="Data time period: 1mo, 3mo, 6mo, 1y, 2y, 5y"),
):
    """
    Retrieves historical OHLCV market data and calculates technical indicators
    (SMA-20, SMA-50, RSI-14, Volatility-20d).
    Falls back gracefully to explicitly labeled demo data if the upstream provider is unavailable.
    """
    clean_ticker = ticker.strip().upper()
    if not clean_ticker or len(clean_ticker) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol format.")

    try:
        data = fetch_stock_history(clean_ticker, period)
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process market request: {str(exc)}")


@router.get("/forecast")
def get_next_day_forecast(
    ticker: str = Query(..., description="Stock ticker symbol (e.g. AAPL, MSFT, TSLA)"),
    period: str = Query("1y", description="Daily history period used for training"),
):
    """Estimate whether the next trading-session close will be higher or lower."""
    clean_ticker = ticker.strip().upper()
    if not clean_ticker or len(clean_ticker) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol format.")

    try:
        closes = fetch_real_closing_prices(clean_ticker, period)
        return create_forecast(closes, clean_ticker)
    except InsufficientHistoryError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ForecastDataError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="scikit-learn is required to generate forecasts; install the AI-service requirements.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
