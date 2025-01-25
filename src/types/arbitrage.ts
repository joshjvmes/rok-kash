export interface ArbitrageSettings {
  symbols: string[];
  min_spread_percentage: number;
  min_profit_amount: number;
  exchanges: string[];
  refresh_interval: number;
  notifications_enabled: boolean;
  excluded_symbols?: string[];
  included_symbols?: string[];
}