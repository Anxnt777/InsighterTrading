import logging
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.data.news_client import fetch_news_articles
from app.nlp.sentiment_analyzer import sentiment_analyzer
from app.nlp.sentiment_aggregator import aggregate_sentiment_metrics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Financial News & Sentiment"])


class SentimentRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, description="List of financial texts or headlines to analyze")


@router.get("/news")
def get_stock_news(
    ticker: str = Query(..., description="Stock ticker symbol (e.g. AAPL, MSFT)"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of articles to retrieve"),
    start_date: Optional[str] = Query(None, description="Filter articles on or after YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter articles on or before YYYY-MM-DD"),
):
    """
    Retrieves latest financial news for the given ticker, analyzes sentiment using FinBERT,
    and returns normalized articles along with aggregate sentiment metrics.
    """
    clean_ticker = ticker.strip().upper()
    if not clean_ticker or len(clean_ticker) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker format.")

    try:
        request_started = time.perf_counter()
        rss_started = time.perf_counter()
        raw_articles = fetch_news_articles(clean_ticker, limit=limit, start_date=start_date, end_date=end_date)
        logger.info(
            "News request %s RSS phase completed in %.1f ms (articles=%d)",
            clean_ticker,
            (time.perf_counter() - rss_started) * 1000,
            len(raw_articles),
        )
        if not raw_articles:
            summary = aggregate_sentiment_metrics([], model_used=sentiment_analyzer.model_used_name)
            logger.info(
                "News request %s completed in %.1f ms with no articles",
                clean_ticker,
                (time.perf_counter() - request_started) * 1000,
            )
            return {
                "symbol": clean_ticker,
                "count": 0,
                "summary": summary,
                "articles": [],
                "statusMessage": "No news articles found for the given criteria.",
            }

        headlines = [art["headline"] for art in raw_articles]
        sentiment_started = time.perf_counter()
        sentiment_scores = sentiment_analyzer.analyze_texts(headlines)
        logger.info(
            "News request %s sentiment phase completed in %.1f ms (engine=%s, articles=%d)",
            clean_ticker,
            (time.perf_counter() - sentiment_started) * 1000,
            sentiment_analyzer.model_used_name,
            len(headlines),
        )

        analyzed_articles = []
        for i, art in enumerate(raw_articles):
            sent = sentiment_scores[i] if i < len(sentiment_scores) else {
                "sentimentLabel": "neutral",
                "sentimentScores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            }
            enriched = dict(art)
            enriched["sentimentLabel"] = sent["sentimentLabel"]
            enriched["sentimentScores"] = sent["sentimentScores"]
            analyzed_articles.append(enriched)

        summary = aggregate_sentiment_metrics(analyzed_articles, model_used=sentiment_analyzer.model_used_name)
        logger.info(
            "News request %s completed in %.1f ms (engine=%s)",
            clean_ticker,
            (time.perf_counter() - request_started) * 1000,
            sentiment_analyzer.model_used_name,
        )

        return {
            "symbol": clean_ticker,
            "count": len(analyzed_articles),
            "summary": summary,
            "articles": analyzed_articles,
            "statusMessage": None,
        }
    except Exception as exc:
        logger.error("Failed to process news request for %s: %s", clean_ticker, exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch and analyze news: {str(exc)}")


@router.post("/nlp/sentiment")
def analyze_headlines_sentiment(request: SentimentRequest):
    """
    Analyzes sentiment directly for a given batch of financial headlines or text snippets.
    Returns probabilities for Positive, Neutral, and Negative classes.
    """
    try:
        results = sentiment_analyzer.analyze_texts(request.texts)
        return {
            "count": len(results),
            "modelUsed": sentiment_analyzer.model_used_name,
            "results": results,
        }
    except Exception as exc:
        logger.error("Sentiment batch analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(exc)}")
