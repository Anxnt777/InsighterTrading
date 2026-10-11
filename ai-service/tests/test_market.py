import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.data.yfinance_client import calculate_technical_indicators, generate_fallback_demo_data

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "insighter-ai-service"


def test_calculate_technical_indicators():
    # Build sample 30-day price series
    prices = [100.0 + i * 0.5 for i in range(30)]
    df = pd.DataFrame({"Close": prices})
    result = calculate_technical_indicators(df)

    assert "sma20" in result.columns
    assert "sma50" in result.columns
    assert "rsi14" in result.columns
    assert "volatility20d" in result.columns
    assert len(result) == 30
    # Last SMA-20 should match mean of last 20 elements
    expected_sma20 = sum(prices[10:]) / 20.0
    assert abs(result["sma20"].iloc[-1] - expected_sma20) < 1e-4


def test_generate_fallback_demo_data():
    demo = generate_fallback_demo_data("AAPL", "1y")
    assert demo["symbol"] == "AAPL"
    assert demo["isDemo"] is True
    assert demo["dataSource"] == "offline_synthetic_demo"
    assert len(demo["bars"]) > 0
    assert "metadata" in demo
    assert demo["metadata"]["currentPrice"] > 0


def test_market_history_endpoint_validation():
    # Test invalid ticker
    response = client.get("/api/v1/market/history?ticker=TOOLONGSYMBOLNAME123")
    assert response.status_code == 400
