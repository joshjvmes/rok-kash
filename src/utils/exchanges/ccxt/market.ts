import { makeRequest } from './config';

export async function fetchCCXTPrice(exchange: string, symbol: string) {
  return await makeRequest(exchange, 'fetchTicker', { symbol });
}

export async function fetchOrderBook(exchange: string, symbol: string) {
  return await makeRequest(exchange, 'fetchOrderBook', { symbol });
}

export async function fetchTrades(exchange: string, symbol: string) {
  return await makeRequest(exchange, 'fetchTrades', { symbol });
}

export async function fetchMarketStructure(exchange: string, symbol: string) {
  return await makeRequest(exchange, 'fetchMarket', { symbol });
}