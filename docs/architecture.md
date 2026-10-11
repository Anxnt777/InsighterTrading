# InsighterTrading Architecture Guide

## 1. System Overview

InsighterTrading is designed as a decoupled, multi-tier intelligence platform:

```
[React + TS Frontend] (Port 5173)
        │
        ▼ (REST / JSON)
[Spring Boot Backend Gateway] (Port 8080)
   ├── [PostgreSQL / H2 Persistence] (Port 5432)
   │
   ▼ (Internal REST / JSON)
[Python FastAPI AI Engine] (Port 8000)
   ├── yfinance Market Feed (Historical OHLCV)
   ├── Technical Indicators Engine (Pandas / NumPy)
   ├── FinBERT Sentiment Pipeline (Transformers)
   ├── ML Trend Classifier (Scikit-Learn / LightGBM)
   └── Explainability Core (SHAP)
```

## 2. Key Principles

1. **Separation of Concerns**:
   - The Frontend handles visualization, interactive charts, and dashboard layout.
   - Spring Boot acts as the enterprise backend-for-frontend (BFF), orchestrating security, persistence, caching, and upstream communication.
   - The Python AI Service is an isolated microservice specialized in statistical calculation, machine learning inference, and financial NLP.
2. **Data Integrity & Fallbacks**:
   - If an external upstream API (e.g. `yfinance`) fails or rate-limits, the AI service returns a properly structured payload marked with `is_demo: true` and an explicit `error_notice`.
   - Never fabricate data as live.
3. **No Financial Advice Disclaimer**:
   - System outputs are framed as educational and academic decision-support metrics.
