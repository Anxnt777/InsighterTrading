package com.insighter.trading;

import com.insighter.trading.client.AiServiceClient;
import com.insighter.trading.dto.NewsArticleDto;
import com.insighter.trading.dto.SentimentScoresDto;
import com.insighter.trading.dto.SentimentSummaryDto;
import com.insighter.trading.dto.StockNewsResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class NewsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiServiceClient aiServiceClient;

    @Test
    void testGetStockNewsSuccess() throws Exception {
        NewsArticleDto article = new NewsArticleDto(
                "AAPL Reports Record Services Revenue Growth",
                "Reuters",
                "2026-10-10T14:30:00Z",
                "https://reuters.com/aapl-sample",
                "AAPL",
                "positive",
                new SentimentScoresDto(0.85, 0.10, 0.05),
                false,
                "yahoo_finance_rss"
        );

        SentimentSummaryDto summary = new SentimentSummaryDto(
                1,
                0.80,
                "Bullish",
                100.0,
                0.0,
                0.0,
                Map.of("positive", 0.85, "neutral", 0.10, "negative", 0.05),
                "Net Probability Difference",
                "ProsusAI/finbert"
        );

        StockNewsResponse response = new StockNewsResponse(
                "AAPL", 1, summary, List.of(article), null
        );

        when(aiServiceClient.fetchStockNews(eq("AAPL"), eq(10), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/stocks/AAPL/news?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.summary.overallSentiment").value("Bullish"))
                .andExpect(jsonPath("$.articles[0].sentimentLabel").value("positive"))
                .andExpect(jsonPath("$.articles[0].source").value("Reuters"));
    }

    @Test
    void testGetStockNewsFallbackWhenAiServiceFails() throws Exception {
        when(aiServiceClient.fetchStockNews(eq("GOOGL"), eq(5), any(), any()))
                .thenThrow(new RuntimeException("AI service connection timeout"));

        mockMvc.perform(get("/api/v1/stocks/GOOGL/news?limit=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("GOOGL"))
                .andExpect(jsonPath("$.articles[0].isDemo").value(true))
                .andExpect(jsonPath("$.articles[0].dataSource").value("backend_offline_fallback"));
    }
}
