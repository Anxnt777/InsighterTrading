package com.insighter.trading.client;

import com.insighter.trading.dto.StockHistoryResponse;
import com.insighter.trading.dto.ForecastResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private final RestClient restClient;

    public AiServiceClient(RestClient aiServiceRestClient) {
        this.restClient = aiServiceRestClient;
    }

    public StockHistoryResponse fetchStockHistory(String ticker, String period) {
        log.info("Calling Python AI service for ticker: {}, period: {}", ticker, period);
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/market/history")
                            .queryParam("ticker", ticker)
                            .queryParam("period", period != null ? period : "1y")
                            .build())
                    .retrieve()
                    .body(StockHistoryResponse.class);
        } catch (RestClientException ex) {
            log.error("Failed to fetch stock history from AI service: {}", ex.getMessage());
            throw ex;
        }
    }

    public com.insighter.trading.dto.StockNewsResponse fetchStockNews(String ticker, int limit, String startDate, String endDate) {
        log.info("Calling Python AI service news for ticker: {}, limit: {}", ticker, limit);
        long startedAt = System.nanoTime();
        try {
            var response = restClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path("/api/v1/news")
                                .queryParam("ticker", ticker)
                                .queryParam("limit", limit);
                        if (startDate != null && !startDate.isBlank()) {
                            builder.queryParam("start_date", startDate);
                        }
                        if (endDate != null && !endDate.isBlank()) {
                            builder.queryParam("end_date", endDate);
                        }
                        return builder.build();
                    })
                    .retrieve()
                    .body(com.insighter.trading.dto.StockNewsResponse.class);
            log.info("Python AI service news call for {} completed in {} ms", ticker, (System.nanoTime() - startedAt) / 1_000_000);
            return response;
        } catch (RestClientException ex) {
            log.error("Failed to fetch stock news from AI service after {} ms: {}", (System.nanoTime() - startedAt) / 1_000_000, ex.getMessage());
            throw ex;
        }
    }

    public ForecastResponse fetchNextDayForecast(String ticker, String period) {
        log.info("Calling Python AI service forecast for ticker: {}, period: {}", ticker, period);
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/market/forecast")
                        .queryParam("ticker", ticker)
                        .queryParam("period", period != null ? period : "1y")
                        .build())
                .retrieve()
                .body(ForecastResponse.class);
    }

    public boolean isHealthy() {
        try {
            var response = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity();
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            log.warn("AI service health check failed: {}", ex.getMessage());
            return false;
        }
    }
}
