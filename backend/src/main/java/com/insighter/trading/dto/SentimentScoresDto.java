package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SentimentScoresDto(
        Double positive,
        Double neutral,
        Double negative
) {
}
