import type { ArbitrageOpportunity } from "../types/exchange";

export async function findArbitrageOpportunities(symbol: string): Promise<ArbitrageOpportunity[]> {
  // Simulated arbitrage opportunities for demo
  return [
    {
      buyExchange: "Coinbase",
      sellExchange: "Kraken",
      symbol: symbol,
      spread: 0.5,
      potential: 100
    },
    {
      buyExchange: "Kraken",
      sellExchange: "Bybit",
      symbol: symbol,
      spread: 0.3,
      potential: 75
    }
  ];
}