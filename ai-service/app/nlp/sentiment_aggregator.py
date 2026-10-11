from typing import Any, Dict, List


def aggregate_sentiment_metrics(
    analyzed_articles: List[Dict[str, Any]],
    model_used: str = "ProsusAI/finbert"
) -> Dict[str, Any]:
    """
    Computes aggregated financial sentiment metrics over a collection of articles.
    
    Aggregation Methodology:
    1. Net Sentiment Score (S_net):
       S_net = (Sum(P_positive) - Sum(P_negative)) / N, normalized to [-1.0, +1.0]
       - S_net > +0.15: 'Bullish'
       - S_net < -0.15: 'Bearish'
       - Between -0.15 and +0.15: 'Neutral'
    2. Distribution: Percentages of articles classified as positive, neutral, or negative.
    3. Average Confidence: Mean probability for each sentiment class across all articles.
    """
    n = len(analyzed_articles)
    if n == 0:
        return {
            "totalArticles": 0,
            "netSentimentScore": 0.0,
            "overallSentiment": "Neutral",
            "positivePercent": 0.0,
            "neutralPercent": 0.0,
            "negativePercent": 0.0,
            "averageScores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            "aggregationMethod": "Net Probability Difference: (Sum(P_pos) - Sum(P_neg)) / N",
            "modelUsed": model_used,
        }

    pos_count = 0
    neu_count = 0
    neg_count = 0

    sum_pos_prob = 0.0
    sum_neu_prob = 0.0
    sum_neg_prob = 0.0

    for art in analyzed_articles:
        scores = art.get("sentimentScores", {})
        p_pos = float(scores.get("positive", 0.0))
        p_neu = float(scores.get("neutral", 0.0))
        p_neg = float(scores.get("negative", 0.0))

        sum_pos_prob += p_pos
        sum_neu_prob += p_neu
        sum_neg_prob += p_neg

        label = art.get("sentimentLabel", "neutral").lower()
        if label == "positive":
            pos_count += 1
        elif label == "negative":
            neg_count += 1
        else:
            neu_count += 1

    net_score = round((sum_pos_prob - sum_neg_prob) / n, 4)
    # Bound to [-1.0, 1.0]
    net_score = max(-1.0, min(1.0, net_score))

    if net_score > 0.15:
        overall = "Bullish"
    elif net_score < -0.15:
        overall = "Bearish"
    else:
        overall = "Neutral"

    return {
        "totalArticles": n,
        "netSentimentScore": net_score,
        "overallSentiment": overall,
        "positivePercent": round((pos_count / n) * 100.0, 1),
        "neutralPercent": round((neu_count / n) * 100.0, 1),
        "negativePercent": round((neg_count / n) * 100.0, 1),
        "averageScores": {
            "positive": round(sum_pos_prob / n, 4),
            "neutral": round(sum_neu_prob / n, 4),
            "negative": round(sum_neg_prob / n, 4),
        },
        "aggregationMethod": "Net Probability Difference: (Sum(P_pos) - Sum(P_neg)) / N",
        "modelUsed": model_used,
    }
