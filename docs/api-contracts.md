# InsighterTrading REST API Contracts

## Spring Boot Backend (Public Gateway) -> Frontend

Base URL: `http://localhost:8080/api/v1`

### 1. Health Check
`GET /health`
```json
{
  "status": "UP",
  "service": "insighter-backend",
  "version": "1.0.0",
  "timestamp": "2026-10-11T18:00:00Z"
}
```

### 2. Stock Historical Data & Indicators
`GET /stocks/{ticker}/history?period=1y`

**Path Parameters**:
- `ticker`: Stock ticker string (e.g. `AAPL`, `MSFT`)

**Query Parameters**:
- `period`: Historical duration (`1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`). Default: `1y`.

**Response (200 OK)**:
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "currency": "USD",
  "exchange": "NMS",
  "period": "1y",
  "dataCount": 252,
  "isDemo": false,
  "dataSource": "yfinance",
  "statusMessage": null,
  "metadata": {
    "currentPrice": 225.50,
    "previousClose": 224.23,
    "change": 1.27,
    "changePercent": 0.57,
    "fiftyTwoWeekHigh": 237.23,
    "fiftyTwoWeekLow": 164.08,
    "volume": 48210300
  },
  "bars": [
    {
      "time": "2025-10-10",
      "open": 224.10,
      "high": 226.00,
      "low": 223.80,
      "close": 225.50,
      "volume": 48210300,
      "sma20": 223.12,
      "sma50": 218.40,
      "rsi14": 58.4,
      "volatility20d": 0.18
    }
  ]
}
```

---

## Python AI Service (Internal API) -> Spring Boot Backend

Base URL: `http://localhost:8000/api/v1`

### 1. Health Check
`GET /health`
```json
{
  "status": "UP",
  "service": "insighter-ai-service",
  "python_version": "3.11.x"
}
```

### 2. Market Historical Ingestion & Indicators
`GET /market/history?ticker={ticker}&period={period}`
Returns market bars with calculated technical indicators and metadata.
