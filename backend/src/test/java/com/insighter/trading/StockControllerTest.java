package com.insighter.trading;

import com.insighter.trading.client.AiServiceClient;
import com.insighter.trading.dto.HistoricalBarDto;
import com.insighter.trading.dto.StockHistoryResponse;
import com.insighter.trading.dto.StockMetadataDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiServiceClient aiServiceClient;

    @Test
    void testHealthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("insighter-backend"));
    }

    @Test
    void testGetStockHistorySuccess() throws Exception {
        StockMetadataDto metadata = new StockMetadataDto(225.5, 224.0, 1.5, 0.67, 237.0, 164.0, 48000000L);
        HistoricalBarDto bar = new HistoricalBarDto("2026-03-20", 224.0, 226.0, 223.5, 225.5, 48000000L, 222.0, 218.0, 58.0, 0.18);
        StockHistoryResponse mockResponse = new StockHistoryResponse(
                "AAPL", "Apple Inc.", "USD", "NASDAQ", "1y", 1, false, "yfinance", null, metadata, List.of(bar)
        );

        when(aiServiceClient.fetchStockHistory(eq("AAPL"), eq("1y"))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/stocks/AAPL/history?period=1y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.companyName").value("Apple Inc."))
                .andExpect(jsonPath("$.isDemo").value(false))
                .andExpect(jsonPath("$.bars[0].close").value(225.5));
    }

    @Test
    void testGetStockHistoryFallbackWhenAiServiceFails() throws Exception {
        when(aiServiceClient.fetchStockHistory(eq("MSFT"), eq("1y")))
                .thenThrow(new RuntimeException("Connection refused"));

        mockMvc.perform(get("/api/v1/stocks/MSFT/history?period=1y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("MSFT"))
                .andExpect(jsonPath("$.isDemo").value(true))
                .andExpect(jsonPath("$.dataSource").value("backend_offline_fallback"));
    }
}
