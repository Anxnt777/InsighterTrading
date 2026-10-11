import email.utils
import html
import logging
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def parse_rfc822_date(date_str: str) -> str:
    """Parses RFC-822 date string into ISO-8601 UTC string."""
    try:
        parsed_tuple = email.utils.parsedate_to_datetime(date_str)
        if parsed_tuple.tzinfo is None:
            parsed_tuple = parsed_tuple.replace(tzinfo=timezone.utc)
        return parsed_tuple.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clean_headline_text(text: str) -> str:
    """Cleans HTML entities and excessive whitespace from news headlines."""
    if not text:
        return ""
    clean = html.unescape(text)
    clean = re.sub(r"<[^>]+>", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def generate_fallback_demo_news(ticker: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Generates explicitly labeled offline demo news when network feeds are unreachable."""
    logger.warning("Generating labeled offline demo news articles for %s", ticker)
    symbol = ticker.upper()
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    templates = [
        (f"{symbol} Reports Quarterly Revenue Growth Driven by High Product Demand", "Financial Times (Demo)", "https://example.com/demo/1"),
        (f"Analysts Maintain Overweight Rating on {symbol} Following Industry Assessment", "MarketPulse (Demo)", "https://example.com/demo/2"),
        (f"Market Fluctuations Impact Tech Sector; {symbol} Trades Flat Mid-Session", "Global Equities (Demo)", "https://example.com/demo/3"),
        (f"Supply Chain Adjustments Pose Short-Term Headwinds for {symbol}", "Business Wire (Demo)", "https://example.com/demo/4"),
        (f"Institutional Investors Increase Holdings in {symbol} Ahead of Earnings", "Equity Daily (Demo)", "https://example.com/demo/5"),
    ]

    results = []
    for i in range(min(limit, len(templates))):
        headline, source, url = templates[i]
        results.append({
            "headline": headline,
            "source": source,
            "publishedAt": now_iso,
            "url": url,
            "ticker": symbol,
            "isDemo": True,
            "dataSource": "offline_synthetic_demo",
        })
    return results


def fetch_yahoo_finance_rss(ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetches real-time financial news from Yahoo Finance RSS feed."""
    symbol = ticker.strip().upper()
    url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={urllib.parse.quote(symbol)}&region=US&lang=en-US"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            xml_data = response.read()

        root = ET.fromstring(xml_data)
        items = root.findall("./channel/item")
        articles: List[Dict[str, Any]] = []

        for item in items[:limit]:
            title_el = item.find("title")
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            source_el = item.find("source")

            headline = clean_headline_text(title_el.text if title_el is not None else "")
            link = link_el.text.strip() if link_el is not None and link_el.text else "#"
            pub_date = parse_rfc822_date(pub_date_el.text if pub_date_el is not None and pub_date_el.text else "")
            source = source_el.text.strip() if source_el is not None and source_el.text else "Yahoo Finance"

            if headline:
                articles.append({
                    "headline": headline,
                    "source": source,
                    "publishedAt": pub_date,
                    "url": link,
                    "ticker": symbol,
                    "isDemo": False,
                    "dataSource": "yahoo_finance_rss",
                })
        return articles
    except Exception as exc:
        logger.warning("Yahoo Finance RSS failed for %s: %s", symbol, exc)
        return []


def fetch_google_news_rss(ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetches financial news articles for ticker from Google News RSS feed."""
    symbol = ticker.strip().upper()
    encoded_query = urllib.parse.quote(f"{symbol} stock")
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            xml_data = response.read()

        root = ET.fromstring(xml_data)
        items = root.findall("./channel/item")
        articles: List[Dict[str, Any]] = []

        for item in items[:limit]:
            title_el = item.find("title")
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            source_el = item.find("source")

            raw_title = title_el.text if title_el is not None else ""
            headline = clean_headline_text(raw_title)
            link = link_el.text.strip() if link_el is not None and link_el.text else "#"
            pub_date = parse_rfc822_date(pub_date_el.text if pub_date_el is not None and pub_date_el.text else "")

            source_name = "Financial Press"
            if source_el is not None and source_el.text:
                source_name = source_el.text.strip()
            elif " - " in headline:
                parts = headline.rsplit(" - ", 1)
                headline = parts[0].strip()
                source_name = parts[1].strip()

            if headline:
                articles.append({
                    "headline": headline,
                    "source": source_name,
                    "publishedAt": pub_date,
                    "url": link,
                    "ticker": symbol,
                    "isDemo": False,
                    "dataSource": "google_news_rss",
                })
        return articles
    except Exception as exc:
        logger.warning("Google News RSS failed for %s: %s", symbol, exc)
        return []


def fetch_news_articles(
    ticker: str,
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves and normalizes financial news articles for the given ticker.
    Uses Yahoo Finance RSS first, falls back to Google News RSS, and ultimately
    labeled offline demo data if all network feeds fail.
    """
    clean_ticker = ticker.strip().upper()
    if not clean_ticker:
        return []

    started_at = time.perf_counter()
    # 1. Primary provider: Yahoo Finance RSS
    provider_started = time.perf_counter()
    articles = fetch_yahoo_finance_rss(clean_ticker, limit=limit)
    yahoo_elapsed_ms = (time.perf_counter() - provider_started) * 1000

    # 2. Secondary provider: Google News RSS
    google_elapsed_ms = 0.0
    if not articles:
        provider_started = time.perf_counter()
        articles = fetch_google_news_rss(clean_ticker, limit=limit)
        google_elapsed_ms = (time.perf_counter() - provider_started) * 1000

    # 3. Offline demo fallback
    if not articles:
        articles = generate_fallback_demo_news(clean_ticker, limit=limit)

    # Optional date filtering if start_date / end_date provided (ISO YYYY-MM-DD)
    if start_date or end_date:
        filtered = []
        for art in articles:
            pub_date_str = art["publishedAt"][:10]  # YYYY-MM-DD
            if start_date and pub_date_str < start_date:
                continue
            if end_date and pub_date_str > end_date:
                continue
            filtered.append(art)
        articles = filtered

    result = articles[:limit]
    logger.info(
        "News RSS retrieval for %s completed in %.1f ms (Yahoo %.1f ms, Google %.1f ms, source=%s, articles=%d)",
        clean_ticker,
        (time.perf_counter() - started_at) * 1000,
        yahoo_elapsed_ms,
        google_elapsed_ms,
        result[0].get("dataSource", "none") if result else "none",
        len(result),
    )
    return result
