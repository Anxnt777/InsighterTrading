package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HistoricalBarDto(
        String time,
        Double open,
        Double high,
        Double low,
        Double close,
        Long volume,
        Double sma20,
        Double sma50,
        Double rsi14,
        Double volatility20d
) {
}
