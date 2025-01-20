export interface PriceCardProps {
  symbol: string;
  price: string;
  change: number;
  exchange: string;
}

export interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  spread: number;
  potential: number;
  buyPrice?: number;
  sellPrice?: number;
}

export interface CoinbasePrice {
  data: {
    base: string;
    currency: string;
    amount: string;
  };
}

export interface KrakenPrice {
  result: {
    [key: string]: {
      c: string[];
    };
  };
}