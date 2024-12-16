import { supabase } from "@/integrations/supabase/client";

interface CoinbasePrice {
  data: {
    base: string;
    currency: string;
    amount: string;
  };
}

export async function fetchPrices(symbols: string[]) {
  try {
    const tickers = await Promise.all(
      symbols.map(async (symbol) => {
        const [base] = symbol.split('/');
        const response = await fetch(`https://api.coinbase.com/v2/prices/${base}-USD/spot`);
        const data: CoinbasePrice = await response.json();
        
        // Calculate a random change percentage for demo purposes
        // In production, you'd want to fetch historical data to calculate real changes
        const randomChange = (Math.random() * 4 - 2).toFixed(2);
        
        return {
          symbol,
          price: parseFloat(data.data.amount).toFixed(2),
          change: parseFloat(randomChange),
          exchange: 'Coinbase'
        };
      })
    );
    return tickers;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}

export async function findArbitrageOpportunities() {
  try {
    const opportunities = [];
    const commonSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

    for (const symbol of commonSymbols) {
      const [base] = symbol.split('/');
      const response = await fetch(`https://api.coinbase.com/v2/prices/${base}-USD/spot`);
      const data: CoinbasePrice = await response.json();
      
      // For demo purposes, create a simulated arbitrage opportunity
      // In production, you'd compare prices across different exchanges
      const currentPrice = parseFloat(data.data.amount);
      const simulatedSpread = (Math.random() * 0.5).toFixed(2);
      
      if (parseFloat(simulatedSpread) > 0.1) {
        opportunities.push({
          buyExchange: 'Coinbase',
          sellExchange: 'Market',
          symbol,
          spread: parseFloat(simulatedSpread),
          potential: parseFloat((parseFloat(simulatedSpread) * currentPrice / 100).toFixed(2))
        });
      }
    }

    return opportunities;
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}