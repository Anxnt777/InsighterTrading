package com.insighter.trading.controller;

import com.insighter.trading.dto.StockHistoryResponse;
import com.insighter.trading.dto.ForecastResponse;
import com.insighter.trading.service.StockService;
import com.insighter.trading.service.ForecastService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stocks")
public class StockController {

    private final StockService stockService;
    private final ForecastService forecastService;

    public StockController(StockService stockService, ForecastService forecastService) {
        this.stockService = stockService;
        this.forecastService = forecastService;
    }

    @GetMapping("/{ticker}/history")
    public ResponseEntity<StockHistoryResponse> getStockHistory(
            @PathVariable String ticker,
            @RequestParam(required = false, defaultValue = "1y") String period
    ) {
        StockHistoryResponse response = stockService.getStockHistory(ticker, period);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{ticker}/forecast")
    public ResponseEntity<ForecastResponse> getNextDayForecast(
            @PathVariable String ticker,
            @RequestParam(required = false, defaultValue = "1y") String period
    ) {
        return ResponseEntity.ok(forecastService.getForecast(ticker, period));
    }
}
