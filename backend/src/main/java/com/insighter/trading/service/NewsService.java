package com.insighter.trading.service;

import com.insighter.trading.client.AiServiceClient;
import com.insighter.trading.dto.NewsArticleDto;
import com.insighter.trading.dto.SentimentScoresDto;
import com.insighter.trading.dto.SentimentSummaryDto;
import com.insighter.trading.dto.StockNewsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsService.class);
    private final AiServiceClient aiServiceClient;

    public NewsService(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    public StockNewsResponse getStockNews(String ticker, int limit, String startDate, String endDate) {
        if (ticker == null || ticker.trim().isEmpty() || ticker.length() > 10) {
            throw new IllegalArgumentException("Ticker symbol must be between 1 and 10 alphanumeric characters.");
        }

        String normalizedTicker = ticker.trim().toUpperCase();
        int safeLimit = Math.max(1, Math.min(limit, 50));

        try {
            return aiServiceClient.fetchStockNews(normalizedTicker, safeLimit, startDate, endDate);
        } catch (Exception ex) {
            log.warn("AI service news call failed for {}. Returning labeled offline fallback: {}", normalizedTicker, ex.getMessage());
            return createOfflineDemoNewsResponse(normalizedTicker, safeLimit, ex.getMessage());
        }
    }

    private StockNewsResponse createOfflineDemoNewsResponse(String ticker, int limit, String reason) {
        String nowIso = Instant.now().toString();
        List<NewsArticleDto> articles = new ArrayList<>();

        articles.add(new NewsArticleDto(
                ticker + " Outperforms Broader Tech Sector with Strong Earnings Outlook",
                "MarketWatch (Offline Fallback)",
                nowIso,
                "https://example.com/demo/1",
                ticker,
                "positive",
                new SentimentScoresDto(0.78, 0.18, 0.04),
                true,
                "backend_offline_fallback"
        ));

        articles.add(new NewsArticleDto(
                "Federal Reserve Interest Rate Stance Leads to Mixed Trading in " + ticker,
                "Reuters (Offline Fallback)",
                nowIso,
                "https://example.com/demo/2",
                ticker,
                "neutral",
                new SentimentScoresDto(0.12, 0.76, 0.12),
                true,
                "backend_offline_fallback"
        ));

        articles.add(new NewsArticleDto(
                "Supply Chain Pressures May Restrain Next Quarter Margins for " + ticker,
                "Bloomberg (Offline Fallback)",
                nowIso,
                "https://example.com/demo/3",
                ticker,
                "negative",
                new SentimentScoresDto(0.08, 0.22, 0.70),
                true,
                "backend_offline_fallback"
        ));

        SentimentSummaryDto summary = new SentimentSummaryDto(
                articles.size(),
                0.22,
                "Bullish",
                33.3,
                33.3,
                33.3,
                Map.of("positive", 0.33, "neutral", 0.38, "negative", 0.29),
                "Net Probability Difference: (Sum(P_pos) - Sum(P_neg)) / N",
                "backend_offline_fallback"
        );

        return new StockNewsResponse(
                ticker,
                articles.size(),
                summary,
                articles,
                "The AI Service is currently unreachable at http://localhost:8000 (" + reason + "). Showing explicitly labeled offline fallback news."
        );
    }
}
