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

### 3. Financial News Stream & Sentiment Analysis
`GET /news?ticker={ticker}&limit={limit}&start_date={start_date}&end_date={end_date}`
Returns normalized articles with individual FinBERT sentiment probabilities and aggregated metrics.

### 4. Direct Headline Sentiment Inference
`POST /nlp/sentiment`
**Request**:
```json
{
  "texts": ["Apple beats quarterly profit projections", "Macro headwinds pressure margins"]
}
```

### 5. Experimental Next-Trading-Session Direction Estimate
`GET /market/forecast?ticker={ticker}&period={period}`

Uses real Yahoo Finance adjusted daily closes to estimate whether the next trading-session close is higher or lower than the latest completed close. `targetDate` is `null` when no exchange calendar is available to establish the date reliably. Synthetic/demo market data is never used for a forecast.

**Response (200 OK)**:
```json
{
  "status": "available",
  "symbol": "AAPL",
  "asOf": "2026-10-09",
  "targetDate": null,
  "currentClose": 245.12,
  "predictedDirection": "higher",
  "probabilityHigher": 0.57,
  "model": "LogisticRegression",
  "trainingObservations": 950,
  "evaluation": {
    "split": "chronological 80/20",
    "testSampleCount": 190,
    "accuracy": 0.54,
    "precision": 0.55,
    "recall": 0.62,
    "confusionMatrix": [[38, 31], [26, 43]],
    "confusionMatrixOrder": "[[true lower/pred lower, true lower/pred higher], [true higher/pred lower, true higher/pred higher]]",
    "majorityBaseline": { "majorityClass": "higher", "accuracy": 0.51 }
  },
  "dataSource": "yfinance",
  "statusMessage": null,
  "disclaimer": "Experimental direction estimate for academic research only; not financial advice or a guaranteed prediction."
}
```

Insufficient eligible history returns HTTP 422; real-provider failures return HTTP 503. Both responses include a `detail` message. The estimator uses lagged daily returns, rolling means/volatility, and moving-average gaps available at each close. Labels compare that close with the following trading session's close. The earliest 80% of eligible labeled rows train the evaluation model; the latest 20% are held out in chronological order without shuffling. A training-majority-class baseline is scored on those same held-out dates. Standardization is fitted only within the training pipeline. After evaluation, a fresh pipeline is fitted on all eligible labeled rows for the latest estimate.
**Response**:
```json
{
  "count": 2,
  "modelUsed": "ProsusAI/finbert",
  "results": [
    {
      "sentimentLabel": "positive",
      "sentimentScores": { "positive": 0.89, "neutral": 0.08, "negative": 0.03 },
      "modelUsed": "ProsusAI/finbert"
    }
  ]
}
```

---

## Spring Boot Backend News Endpoint
`GET /api/v1/stocks/{ticker}/news?limit=10`
Returns `StockNewsResponse` containing list of articles and `SentimentSummaryDto` (net sentiment score, distribution percentages, model name, and aggregation methodology).

## Spring Boot Backend Forecast Endpoint
`GET /api/v1/stocks/{ticker}/forecast?period=1y`

Forwards to the Python forecast endpoint and returns the same forecast structure. Provider or insufficient-history failures are returned as `status: "unavailable"` with a message and no fabricated forecast values.
