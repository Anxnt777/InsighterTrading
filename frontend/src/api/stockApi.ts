import axios from 'axios';
import { StockHistoryResponse } from '../types/stock';

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

  async getHealth(): Promise<{ status: string; service: string }> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};
