export interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  spread: number;
  potential: number;
  timestamp?: string;
  buyPrice?: number;
  sellPrice?: number;
}

export interface PriceCardProps {
  symbol: string;
  price: string;
  change: number;
  exchange: string;
}

export interface CoinbasePrice {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

export interface KrakenPrice {
  result: {
    [key: string]: {
      c: string[];
    };
  };
}