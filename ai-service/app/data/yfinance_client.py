import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


def calculate_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates SMA-20, SMA-50, RSI-14, and 20-day annualized volatility."""
    if len(df) == 0:
        return df

    # Simple Moving Averages
    df["sma20"] = df["Close"].rolling(window=20, min_periods=1).mean()
    df["sma50"] = df["Close"].rolling(window=50, min_periods=1).mean()

    # Relative Strength Index (RSI 14)
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.rolling(window=14, min_periods=1).mean()
    avg_loss = loss.rolling(window=14, min_periods=1).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["rsi14"] = 100.0 - (100.0 / (1.0 + rs))
    df["rsi14"] = df["rsi14"].fillna(50.0)  # Default neutral RSI if insufficient bars

    # 20-Day Annualized Volatility
    daily_returns = df["Close"].pct_change()
    df["volatility20d"] = daily_returns.rolling(window=20, min_periods=2).std() * np.sqrt(252)
    df["volatility20d"] = df["volatility20d"].fillna(0.0)

    return df


def generate_fallback_demo_data(ticker: str, period: str) -> Dict[str, Any]:
    """Generates explicitly labelled deterministic demo data if external feed is unreachable."""
    logger.warning("Generating explicitly labeled demo fallback data for %s", ticker)
    num_days = 250 if period in ["1y", "2y"] else 60
    base_price = 150.0
    today = datetime.now()
    dates = [today - timedelta(days=num_days - i) for i in range(num_days)]

    bars: List[Dict[str, Any]] = []
    current = base_price

    for idx, dt in enumerate(dates):
        # Deterministic wave pattern for testing
        cycle = math.sin(idx / 10.0) * 5.0
        open_price = round(current + cycle * 0.2, 2)
        close_price = round(open_price + math.cos(idx / 8.0) * 2.0, 2)
        high_price = round(max(open_price, close_price) + 1.5, 2)
        low_price = round(min(open_price, close_price) - 1.2, 2)
        volume = int(35000000 + abs(cycle) * 1000000)

        current = close_price

        bars.append({
            "time": dt.strftime("%Y-%m-%d"),
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "volume": volume,
            "sma20": round(close_price * 0.98, 2),
            "sma50": round(close_price * 0.95, 2),
            "rsi14": 52.5,
            "volatility20d": 0.22,
        })

    last_bar = bars[-1]
    prev_bar = bars[-2]
    price_change = round(last_bar["close"] - prev_bar["close"], 2)
    pct_change = round((price_change / prev_bar["close"]) * 100.0, 2)

    return {
        "symbol": ticker.upper(),
        "companyName": f"{ticker.upper()} (Demo Fallback)",
        "currency": "USD",
        "exchange": "DEMO_FEED",
        "period": period,
        "dataCount": len(bars),
        "isDemo": True,
        "dataSource": "offline_synthetic_demo",
        "statusMessage": "External market feed was unreachable or returned empty data. Displaying labeled offline demo data for interface testing.",
        "metadata": {
            "currentPrice": last_bar["close"],
            "previousClose": prev_bar["close"],
            "change": price_change,
            "changePercent": pct_change,
            "fiftyTwoWeekHigh": round(base_price * 1.25, 2),
            "fiftyTwoWeekLow": round(base_price * 0.85, 2),
            "volume": last_bar["volume"],
        },
        "bars": bars,
    }


def fetch_stock_history(ticker: str, period: str = "1y") -> Dict[str, Any]:
    """Fetches real historical stock data from yfinance, or falls back to labeled demo data."""
    symbol = ticker.strip().upper()
    valid_periods = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
    if period not in valid_periods:
        period = "1y"

    try:
        yf_ticker = yf.Ticker(symbol)
        df = yf_ticker.history(period=period, auto_adjust=True)

        if df is None or len(df) == 0:
            logger.info("No market bars returned by yfinance for %s. Using demo fallback.", symbol)
            return generate_fallback_demo_data(symbol, period)

        df = calculate_technical_indicators(df)

        bars: List[Dict[str, Any]] = []
        for index, row in df.iterrows():
            time_str = index.strftime("%Y-%m-%d") if hasattr(index, "strftime") else str(index)[:10]
            bars.append({
                "time": time_str,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
                "sma20": round(float(row["sma20"]), 2) if not np.isnan(row["sma20"]) else None,
                "sma50": round(float(row["sma50"]), 2) if not np.isnan(row["sma50"]) else None,
                "rsi14": round(float(row["rsi14"]), 2) if not np.isnan(row["rsi14"]) else 50.0,
                "volatility20d": round(float(row["volatility20d"]), 4) if not np.isnan(row["volatility20d"]) else 0.0,
            })

        # Fetch ticker metadata (fast info or info)
        fast_info = getattr(yf_ticker, "fast_info", None)
        current_price = None
        prev_close = None
        fifty_two_high = None
        fifty_two_low = None

        if fast_info:
            current_price = getattr(fast_info, "last_price", None)
            prev_close = getattr(fast_info, "previous_close", None)
            fifty_two_high = getattr(fast_info, "year_high", None)
            fifty_two_low = getattr(fast_info, "year_low", None)

        if current_price is None and len(bars) > 0:
            current_price = bars[-1]["close"]
        if prev_close is None and len(bars) > 1:
            prev_close = bars[-2]["close"]

        change = round(current_price - prev_close, 2) if current_price and prev_close else 0.0
        change_pct = round((change / prev_close) * 100.0, 2) if prev_close and prev_close != 0 else 0.0

        # Attempt to get company name
        company_name = symbol
        try:
            info = yf_ticker.get_info()
            if isinstance(info, dict):
                company_name = info.get("shortName") or info.get("longName") or symbol
        except Exception:
            company_name = symbol

        return {
            "symbol": symbol,
            "companyName": company_name,
            "currency": "USD",
            "exchange": "US_MARKET",
            "period": period,
            "dataCount": len(bars),
            "isDemo": False,
            "dataSource": "yfinance",
            "statusMessage": None,
            "metadata": {
                "currentPrice": round(float(current_price), 2) if current_price else 0.0,
                "previousClose": round(float(prev_close), 2) if prev_close else 0.0,
                "change": change,
                "changePercent": change_pct,
                "fiftyTwoWeekHigh": round(float(fifty_two_high), 2) if fifty_two_high else None,
                "fiftyTwoWeekLow": round(float(fifty_two_low), 2) if fifty_two_low else None,
                "volume": bars[-1]["volume"] if len(bars) > 0 else 0,
            },
            "bars": bars,
        }

    except Exception as exc:
        logger.error("Error fetching market data for %s: %s", symbol, exc)
        return generate_fallback_demo_data(symbol, period)
