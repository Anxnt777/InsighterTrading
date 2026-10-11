package com.insighter.trading.controller;

import com.insighter.trading.dto.StockNewsResponse;
import com.insighter.trading.service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stocks")
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping("/{ticker}/news")
    public ResponseEntity<StockNewsResponse> getStockNews(
            @PathVariable String ticker,
            @RequestParam(required = false, defaultValue = "10") int limit,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        StockNewsResponse response = newsService.getStockNews(ticker, limit, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}
