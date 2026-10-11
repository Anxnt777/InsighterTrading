package com.insighter.trading.service;

import com.insighter.trading.client.AiServiceClient;
import com.insighter.trading.dto.HistoricalBarDto;
import com.insighter.trading.dto.StockHistoryResponse;
import com.insighter.trading.dto.StockMetadataDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);
    private final AiServiceClient aiServiceClient;

    public StockService(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    public StockHistoryResponse getStockHistory(String ticker, String period) {
        if (ticker == null || ticker.trim().isEmpty() || ticker.length() > 10) {
            throw new IllegalArgumentException("Ticker symbol must be between 1 and 10 alphanumeric characters.");
        }

        String normalizedTicker = ticker.trim().toUpperCase();
        String normalizedPeriod = (period == null || period.trim().isEmpty()) ? "1y" : period.trim();

        try {
            return aiServiceClient.fetchStockHistory(normalizedTicker, normalizedPeriod);
        } catch (Exception ex) {
            log.warn("AI service call failed for {}. Returning clearly labeled offline fallback.", normalizedTicker);
            return createOfflineDemoResponse(normalizedTicker, normalizedPeriod, ex.getMessage());
        }
    }

    private StockHistoryResponse createOfflineDemoResponse(String ticker, String period, String reason) {
        List<HistoricalBarDto> bars = new ArrayList<>();
        LocalDate today = LocalDate.now();
        double price = 100.0;

        for (int i = 60; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            price += (Math.sin(i / 5.0) * 2.0);
            double open = Math.round(price * 100.0) / 100.0;
            double high = Math.round((open + 1.5) * 100.0) / 100.0;
            double low = Math.round((open - 1.2) * 100.0) / 100.0;
            double close = Math.round((open + 0.3) * 100.0) / 100.0;

            bars.add(new HistoricalBarDto(
                    date.toString(),
                    open,
                    high,
                    low,
                    close,
                    15000000L,
                    open * 0.99,
                    open * 0.97,
                    50.0,
                    0.20
            ));
        }

        HistoricalBarDto last = bars.get(bars.size() - 1);
        HistoricalBarDto prev = bars.get(bars.size() - 2);
        double change = Math.round((last.close() - prev.close()) * 100.0) / 100.0;
        double pct = Math.round((change / prev.close()) * 10000.0) / 100.0;

        StockMetadataDto metadata = new StockMetadataDto(
                last.close(),
                prev.close(),
                change,
                pct,
                120.0,
                80.0,
                last.volume()
        );

        return new StockHistoryResponse(
                ticker,
                ticker + " (Offline Demo Fallback)",
                "USD",
                "DEMO",
                period,
                bars.size(),
                true,
                "backend_offline_fallback",
                "The AI Service is currently unreachable at http://localhost:8000 (" + reason + "). Showing explicitly labeled offline demo data.",
                metadata,
                bars
        );
    }
}
