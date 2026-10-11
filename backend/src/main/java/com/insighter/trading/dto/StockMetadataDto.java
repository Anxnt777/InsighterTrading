package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StockMetadataDto(
        Double currentPrice,
        Double previousClose,
        Double change,
        Double changePercent,
        Double fiftyTwoWeekHigh,
        Double fiftyTwoWeekLow,
        Long volume
) {
}
