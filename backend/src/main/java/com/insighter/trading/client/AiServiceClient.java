package com.insighter.trading.client;

import com.insighter.trading.dto.StockHistoryResponse;
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
