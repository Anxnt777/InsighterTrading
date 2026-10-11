package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StockNewsResponse(
        String symbol,
        Integer count,
        SentimentSummaryDto summary,
        List<NewsArticleDto> articles,
        String statusMessage
) {
}
