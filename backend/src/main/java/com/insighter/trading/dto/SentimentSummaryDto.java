package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SentimentSummaryDto(
        Integer totalArticles,
        Double netSentimentScore,
        String overallSentiment,
        Double positivePercent,
        Double neutralPercent,
        Double negativePercent,
        Map<String, Double> averageScores,
        String aggregationMethod,
        String modelUsed
) {
}
