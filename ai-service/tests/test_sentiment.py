import sys
import time
from concurrent.futures import ThreadPoolExecutor
from types import ModuleType

from fastapi.testclient import TestClient
from app.main import app
from app.nlp.sentiment_analyzer import FinBertSentimentAnalyzer, analyze_with_financial_lexicon, sentiment_analyzer
from app.nlp.sentiment_aggregator import aggregate_sentiment_metrics
from app.data.news_client import generate_fallback_demo_news, clean_headline_text

client = TestClient(app)


def test_concurrent_finbert_initialization_runs_only_once(monkeypatch):
    calls = {"tokenizer": 0, "model": 0}

    class FakeTokenizer:
        @classmethod
        def from_pretrained(cls, _name):
            calls["tokenizer"] += 1
            time.sleep(0.05)
            return cls()

    class FakeModel:
        @classmethod
        def from_pretrained(cls, _name):
            calls["model"] += 1
            time.sleep(0.05)
            return cls()

        def eval(self):
            return self

    fake_transformers = ModuleType("transformers")
    fake_transformers.AutoTokenizer = FakeTokenizer
    fake_transformers.AutoModelForSequenceClassification = FakeModel
    monkeypatch.setitem(sys.modules, "torch", ModuleType("torch"))
    monkeypatch.setitem(sys.modules, "transformers", fake_transformers)

    analyzer = FinBertSentimentAnalyzer()
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(lambda _index: analyzer._load_model(), range(8)))

    assert calls == {"tokenizer": 1, "model": 1}
    assert analyzer._is_loaded is True
    assert analyzer._load_failed is False
    assert analyzer.model_used_name == "ProsusAI/finbert"


def test_finbert_initialization_failure_uses_truthful_lexicon_fallback(monkeypatch):
    fake_transformers = ModuleType("transformers")
    monkeypatch.setitem(sys.modules, "torch", ModuleType("torch"))
    monkeypatch.setitem(sys.modules, "transformers", fake_transformers)

    analyzer = FinBertSentimentAnalyzer()
    assert analyzer.warm_up() == "financial_lexicon_fallback"
    results = analyzer.analyze_texts(["Company beats profit growth expectations"])

    assert analyzer._load_failed is True
    assert analyzer._fallback_active is True
    assert analyzer.model_used_name == "financial_lexicon_fallback"
    assert results[0]["modelUsed"] == "financial_lexicon_fallback"
    assert results[0]["sentimentLabel"] == "positive"


def test_clean_headline_text():
    raw = "Apple &amp; Microsoft &lt;b&gt;Surge&lt;/b&gt;   in Trading\n"
    cleaned = clean_headline_text(raw)
    assert cleaned == "Apple & Microsoft Surge in Trading"


def test_financial_lexicon_positive():
    text = "Company reports record profit growth and beats analyst earnings estimates"
    label, scores = analyze_with_financial_lexicon(text)
    assert label == "positive"
    assert scores["positive"] > scores["negative"]
    assert scores["positive"] > scores["neutral"]


def test_financial_lexicon_negative():
    text = "Company faces steep loss, shares plunge after major debt downgrade warning"
    label, scores = analyze_with_financial_lexicon(text)
    assert label == "negative"
    assert scores["negative"] > scores["positive"]


def test_financial_lexicon_neutral():
    text = "Federal Reserve holds scheduled meeting on Wednesday afternoon"
    label, scores = analyze_with_financial_lexicon(text)
    assert label == "neutral"
    assert scores["neutral"] >= 0.50


def test_aggregate_sentiment_metrics_bullish():
    articles = [
        {"sentimentLabel": "positive", "sentimentScores": {"positive": 0.8, "neutral": 0.15, "negative": 0.05}},
        {"sentimentLabel": "positive", "sentimentScores": {"positive": 0.7, "neutral": 0.20, "negative": 0.10}},
        {"sentimentLabel": "neutral", "sentimentScores": {"positive": 0.2, "neutral": 0.70, "negative": 0.10}},
    ]
    summary = aggregate_sentiment_metrics(articles)
    assert summary["totalArticles"] == 3
    assert summary["overallSentiment"] == "Bullish"
    assert summary["netSentimentScore"] > 0.15
    assert summary["positivePercent"] == 66.7
    assert summary["negativePercent"] == 0.0


def test_aggregate_sentiment_metrics_empty():
    summary = aggregate_sentiment_metrics([])
    assert summary["totalArticles"] == 0
    assert summary["netSentimentScore"] == 0.0
    assert summary["overallSentiment"] == "Neutral"


def test_generate_fallback_demo_news():
    fallback = generate_fallback_demo_news("NVDA", limit=3)
    assert len(fallback) == 3
    for art in fallback:
        assert art["ticker"] == "NVDA"
        assert art["isDemo"] is True
        assert art["dataSource"] == "offline_synthetic_demo"
        assert "headline" in art
        assert "url" in art
        assert "publishedAt" in art


def test_nlp_sentiment_batch_endpoint():
    payload = {
        "texts": [
            "Tech giant posts robust revenue growth",
            "Market sell-off drives shares lower amid recession worries"
        ]
    }
    response = client.post("/api/v1/nlp/sentiment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2
    assert "sentimentLabel" in data["results"][0]
    assert "sentimentScores" in data["results"][0]


def test_get_stock_news_endpoint():
    response = client.get("/api/v1/news?ticker=AAPL&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert "count" in data
    assert "summary" in data
    assert "articles" in data
    assert data["summary"]["totalArticles"] == data["count"]
