import axios from 'axios';
import { NextDayForecast, StockHistoryResponse, StockNewsResponse } from '../types/stock';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const stockApi = {
  async getStockHistory(ticker: string, period: string = '1y'): Promise<StockHistoryResponse> {
    const response = await axios.get<StockHistoryResponse>(
      `${API_BASE_URL}/stocks/${encodeURIComponent(ticker)}/history`,
      {
        params: { period },
        timeout: 20000,
      }
    );
    return response.data;
  },

  async getStockNews(ticker: string, limit: number = 10): Promise<StockNewsResponse> {
    const response = await axios.get<StockNewsResponse>(
      `${API_BASE_URL}/stocks/${encodeURIComponent(ticker)}/news`,
      {
        params: { limit },
        timeout: 25000,
      }
    );
    return response.data;
  },

  async getNextDayForecast(ticker: string, period: string = '1y', signal?: AbortSignal): Promise<NextDayForecast> {
    const response = await axios.get<NextDayForecast>(
      `${API_BASE_URL}/stocks/${encodeURIComponent(ticker)}/forecast`,
      { params: { period }, timeout: 30000, signal }
    );
    return response.data;
  },

  async getHealth(): Promise<{ status: string; service: string }> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};
