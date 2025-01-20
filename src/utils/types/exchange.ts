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
