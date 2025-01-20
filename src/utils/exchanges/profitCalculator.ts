import { supabase } from "@/integrations/supabase/client";

interface ExchangeFees {
  tradingFee: number;
  withdrawalFee: number;
  transferTime: number;
}

export async function getExchangeFees(exchangeName: string): Promise<ExchangeFees | null> {
  try {
    const { data, error } = await supabase
      .from('exchange_metadata')
      .select('trading_fee_percentage, withdrawal_fee_flat, avg_transfer_time_minutes')
      .eq('exchange_name', exchangeName)
      .single();

    if (error) throw error;

    return {
      tradingFee: data.trading_fee_percentage / 100, // Convert percentage to decimal
      withdrawalFee: data.withdrawal_fee_flat,
      transferTime: data.avg_transfer_time_minutes
    };
  } catch (error) {
    console.error(`Error fetching fees for ${exchangeName}:`, error);
    return null;
  }
}

export async function calculateArbitrageProfitability(
  buyPrice: number,
  sellPrice: number,
  amount: number,
  buyExchange: string,
  sellExchange: string,
  slippagePercentage: number = 0.5
): Promise<{
  spread: number;
  potential: number;
  isViable: boolean;
  details: {
    grossProfit: number;
    buyFees: number;
    sellFees: number;
    transferFees: number;
    slippageCost: number;
    netProfit: number;
    timeToExecute: number;
  };
}> {
  // Fetch exchange fees
  const [buyExchangeFees, sellExchangeFees] = await Promise.all([
    getExchangeFees(buyExchange),
    getExchangeFees(sellExchange)
  ]);

  if (!buyExchangeFees || !sellExchangeFees) {
    throw new Error('Unable to fetch exchange fees');
  }

  // Calculate spread
  const spread = ((sellPrice - buyPrice) / buyPrice) * 100;

  // Calculate slippage impact
  const slippageImpact = (amount * buyPrice * slippagePercentage) / 100;

  // Calculate fees
  const buyTradingFee = amount * buyPrice * buyExchangeFees.tradingFee;
  const sellTradingFee = amount * sellPrice * sellExchangeFees.tradingFee;
  const transferFee = buyExchangeFees.withdrawalFee;

  // Calculate profits
  const grossProfit = (sellPrice - buyPrice) * amount;
  const totalFees = buyTradingFee + sellTradingFee + transferFee + slippageImpact;
  const netProfit = grossProfit - totalFees;

  // Calculate total execution time (in minutes)
  const timeToExecute = buyExchangeFees.transferTime;

  // Determine if the arbitrage is viable (profitable after all fees)
  const isViable = netProfit > 0;

  return {
    spread,
    potential: netProfit,
    isViable,
    details: {
      grossProfit,
      buyFees: buyTradingFee,
      sellFees: sellTradingFee,
      transferFees: transferFee,
      slippageCost: slippageImpact,
      netProfit,
      timeToExecute
    }
  };
}