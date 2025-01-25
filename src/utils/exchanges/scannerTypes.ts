export interface ExchangePair {
  exchange: string;
  symbol: string;
  price: number | null;
}

export interface Market {
  exchange: string;
  symbol: string;
  active: boolean;
}

export interface ScannerSettings {
  exchanges: string[];
  included_symbols: string[];
  excluded_symbols: string[];
  min_spread_percentage: number;
  request_delay_ms: number;
  max_concurrent_requests: number;
}