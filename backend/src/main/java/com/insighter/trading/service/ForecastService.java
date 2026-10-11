package com.insighter.trading.service;

import com.insighter.trading.client.AiServiceClient;
import com.insighter.trading.dto.ForecastResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class ForecastService {

    private static final String DISCLAIMER = "Experimental direction estimate for academic research only; not financial advice or a guaranteed prediction.";
    private final AiServiceClient aiServiceClient;

    public ForecastService(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    public ForecastResponse getForecast(String ticker, String period) {
        String symbol = ticker == null ? "" : ticker.trim().toUpperCase();
        try {
            return aiServiceClient.fetchNextDayForecast(symbol, period);
        } catch (HttpStatusCodeException ex) {
            String message = switch (ex.getStatusCode().value()) {
                case 422 -> "Forecast unavailable: insufficient eligible real history for training and evaluation.";
                case 503 -> "Forecast unavailable: the required model dependency or real market data provider is unavailable.";
                default -> "Forecast unavailable: the forecasting service rejected the request.";
            };
            return unavailable(symbol, message);
        } catch (Exception ex) {
            return unavailable(symbol, "Forecast unavailable: the forecasting service could not be reached.");
        }
    }

    private ForecastResponse unavailable(String symbol, String message) {
        return new ForecastResponse(
                "unavailable", symbol, null, null, null, null, null, "LogisticRegression",
                null, null, null, message, DISCLAIMER
        );
    }
}
