import logging
import os
import re
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Financial lexicon for resilient fallback when FinBERT is offline or disabled
FINANCIAL_POSITIVE_TERMS = {
    "surge", "surges", "growth", "grow", "profit", "profitable", "beat", "beats",
    "gain", "gains", "bullish", "upgrade", "upgrades", "upgraded", "record",
    "rebound", "rally", "rallies", "outperform", "outperformed", "positive", "boost",
    "boosts", "expansion", "dividend", "dividends", "strong", "stronger", "soar", "soars"
}

FINANCIAL_NEGATIVE_TERMS = {
    "drop", "drops", "loss", "losses", "slump", "slumps", "decline", "declines",
    "bearish", "downgrade", "downgrades", "downgraded", "fall", "falls", "fallen",
    "headwind", "headwinds", "plunge", "plunges", "warning", "miss", "misses",
    "weak", "weaker", "cut", "cuts", "risk", "risks", "debt", "recession", "downside"
}


def analyze_with_financial_lexicon(text: str) -> Tuple[str, Dict[str, float]]:
    """Rule-based financial sentiment scoring for fallback when transformer model is offline."""
    words = re.findall(r"\b[a-z]+\b", text.lower())
    if not words:
        return "neutral", {"positive": 0.20, "neutral": 0.60, "negative": 0.20}

    pos_score = sum(1 for w in words if w in FINANCIAL_POSITIVE_TERMS)
    neg_score = sum(1 for w in words if w in FINANCIAL_NEGATIVE_TERMS)

    if pos_score > neg_score:
        p_pos = min(0.85, 0.50 + 0.15 * (pos_score - neg_score))
        p_neg = max(0.05, 0.20 - 0.05 * (pos_score - neg_score))
        p_neu = round(1.0 - p_pos - p_neg, 4)
        return "positive", {"positive": round(p_pos, 4), "neutral": p_neu, "negative": round(p_neg, 4)}
    elif neg_score > pos_score:
        p_neg = min(0.85, 0.50 + 0.15 * (neg_score - pos_score))
        p_pos = max(0.05, 0.20 - 0.05 * (neg_score - pos_score))
        p_neu = round(1.0 - p_pos - p_neg, 4)
        return "negative", {"positive": round(p_pos, 4), "neutral": p_neu, "negative": round(p_neg, 4)}
    else:
        return "neutral", {"positive": 0.15, "neutral": 0.70, "negative": 0.15}


class FinBertSentimentAnalyzer:
    """
    Singleton-style sentiment analyzer utilizing ProsusAI/finbert.
    Implements lazy model loading to avoid cold-start penalties and memory leaks.
    Gracefully degrades to financial lexicon analysis if PyTorch/HuggingFace is unavailable.
    """

    def __init__(self):
        self.model_name = "ProsusAI/finbert"
        self.enable_finbert = os.getenv("ENABLE_FINBERT", "true").lower() == "true"
        self._tokenizer = None
        self._model = None
        self._is_loaded = False
        self._load_failed = False
        self._fallback_active = False
        self._load_lock = threading.Lock()

    def _load_model(self):
        """Loads FinBERT model and tokenizer once into memory."""
        if self._is_loaded or self._load_failed:
            return

        # FastAPI may run synchronous endpoint calls in parallel worker threads.
        # Serialize the complete import/load attempt and recheck state after acquiring
        # the lock so one request cannot observe another request's partial setup.
        with self._load_lock:
            if self._is_loaded or self._load_failed:
                return

            if not self.enable_finbert:
                logger.info("FinBERT is disabled via ENABLE_FINBERT=false. Using financial lexicon fallback.")
                self._fallback_active = True
                return

            load_started = time.perf_counter()
            try:
                logger.info("Initializing ProsusAI/finbert transformer model...")
                import torch
                from transformers import AutoTokenizer, AutoModelForSequenceClassification

                self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self._model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
                self._model.eval()  # Set to inference mode
                self._is_loaded = True
                logger.info("Successfully loaded ProsusAI/finbert into memory in %.1f ms.", (time.perf_counter() - load_started) * 1000)
            except Exception as exc:
                # Discard partial objects and make the fallback state terminal for this
                # analyzer instance so waiting requests all take the same safe path.
                self._tokenizer = None
                self._model = None
                self._load_failed = True
                self._fallback_active = True
                logger.warning(
                    "Could not load ProsusAI/finbert after %.1f ms (%s). Falling back to financial lexicon analyzer.",
                    (time.perf_counter() - load_started) * 1000,
                    exc,
                )

    @property
    def model_used_name(self) -> str:
        if self._is_loaded and not self._fallback_active:
            return "ProsusAI/finbert"
        return "financial_lexicon_fallback"

    def warm_up(self) -> str:
        """Initialize FinBERT if enabled and return the active engine name."""
        self._load_model()
        return self.model_used_name

    def analyze_texts(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyzes a batch of headlines and returns sentiment labels and probabilities."""
        if not texts:
            return []

        self._load_model()

        # If FinBERT is ready, run transformer inference
        if self._is_loaded and not self._fallback_active:
            try:
                import torch

                inference_started = time.perf_counter()
                inputs = self._tokenizer(
                    texts,
                    padding=True,
                    truncation=True,
                    max_length=128,
                    return_tensors="pt"
                )

                with torch.no_grad():
                    outputs = self._model(**inputs)
                    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
                logger.info(
                    "FinBERT inference completed in %.1f ms for %d texts.",
                    (time.perf_counter() - inference_started) * 1000,
                    len(texts),
                )

                results = []
                # FinBERT config id2label mapping (0: positive, 1: negative, 2: neutral)
                id2label = self._model.config.id2label

                for i in range(len(texts)):
                    probs_tensor = probabilities[i]
                    scores_dict = {}
                    for idx, label_name in id2label.items():
                        scores_dict[label_name.lower()] = round(float(probs_tensor[idx]), 4)

                    best_label = max(scores_dict, key=scores_dict.get)
                    results.append({
                        "sentimentLabel": best_label,
                        "sentimentScores": {
                            "positive": scores_dict.get("positive", 0.0),
                            "neutral": scores_dict.get("neutral", 0.0),
                            "negative": scores_dict.get("negative", 0.0),
                        },
                        "modelUsed": "ProsusAI/finbert",
                    })
                return results
            except Exception as exc:
                logger.error(
                    "FinBERT inference failed after %.1f ms: %s. Reverting to lexicon fallback.",
                    (time.perf_counter() - inference_started) * 1000,
                    exc,
                )

        # Fallback path
        results = []
        for text in texts:
            label, scores = analyze_with_financial_lexicon(text)
            results.append({
                "sentimentLabel": label,
                "sentimentScores": scores,
                "modelUsed": "financial_lexicon_fallback",
            })
        return results


# Global singleton instance
sentiment_analyzer = FinBertSentimentAnalyzer()
