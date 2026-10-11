package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StockHistoryResponse(
        String symbol,
        String companyName,
        String currency,
        String exchange,
        String period,
        Integer dataCount,
        Boolean isDemo,
        String dataSource,
        String statusMessage,
        StockMetadataDto metadata,
        List<HistoricalBarDto> bars
) {
}
