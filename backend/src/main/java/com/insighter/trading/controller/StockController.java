package com.insighter.trading.controller;

import com.insighter.trading.dto.StockHistoryResponse;
import com.insighter.trading.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/{ticker}/history")
    public ResponseEntity<StockHistoryResponse> getStockHistory(
            @PathVariable String ticker,
            @RequestParam(required = false, defaultValue = "1y") String period
    ) {
        StockHistoryResponse response = stockService.getStockHistory(ticker, period);
        return ResponseEntity.ok(response);
    }
}
