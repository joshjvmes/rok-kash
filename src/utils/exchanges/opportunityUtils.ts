import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

interface OpportunityParams {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  minSpreadPercentage: number;
  minProfitAmount: number;
  userId: string;
}

export function calculateSpreadAndProfit(buyPrice: number, sellPrice: number): {
  spread: number;
  potential: number;
} {
  const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
  const potential = (sellPrice - buyPrice) * 1000; // Assuming 1000 units traded
  return { spread, potential };
}

export async function processOpportunity({
  buyExchange,
  sellExchange,
  symbol,
  buyPrice,
  sellPrice,
  minSpreadPercentage,
  minProfitAmount,
  userId
}: OpportunityParams): Promise<ArbitrageOpportunity | null> {
  const { spread, potential } = calculateSpreadAndProfit(buyPrice, sellPrice);

  console.log(`Found potential opportunity: ${buyExchange} -> ${sellExchange}`);
  console.log(`Spread: ${spread.toFixed(4)}%, Potential: $${potential.toFixed(2)}`);
  console.log(`Minimum required: Spread ${minSpreadPercentage}%, Profit $${minProfitAmount}`);

  if (spread >= minSpreadPercentage && potential >= minProfitAmount) {
    console.log('Opportunity meets minimum requirements - adding to list');
    const opportunity = {
      buyExchange,
      sellExchange,
      symbol,
      spread: parseFloat(spread.toFixed(2)),
      potential: parseFloat(potential.toFixed(2))
    };

    // Store the opportunity in the database
    const { error } = await supabase
      .from('arbitrage_opportunities')
      .insert({
        buy_exchange: opportunity.buyExchange,
        sell_exchange: opportunity.sellExchange,
        symbol: opportunity.symbol,
        spread: opportunity.spread,
        potential_profit: opportunity.potential,
        status: 'pending',
        user_id: userId
      });

    if (error) {
      console.error('Error storing arbitrage opportunity:', error);
      return null;
    }

    return opportunity;
  } else {
    console.log('Opportunity filtered out - does not meet minimum requirements');
    return null;
  }
}