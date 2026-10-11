package com.insighter.trading.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ForecastResponse(
        String status,
        String symbol,
        String asOf,
        String targetDate,
        Double currentClose,
        String predictedDirection,
        Double probabilityHigher,
        String model,
        Integer trainingObservations,
        ForecastEvaluation evaluation,
        String dataSource,
        String statusMessage,
        String disclaimer
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ForecastEvaluation(
            String split,
            Integer testSampleCount,
            Double accuracy,
            Double precision,
            Double recall,
            int[][] confusionMatrix,
            String confusionMatrixOrder,
            MajorityBaseline majorityBaseline
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MajorityBaseline(String majorityClass, Double accuracy) {}
}
