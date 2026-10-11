package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NewsArticleDto(
        String headline,
        String source,
        String publishedAt,
        String url,
        String ticker,
        String sentimentLabel,
        SentimentScoresDto sentimentScores,
        Boolean isDemo,
        String dataSource
) {
}
