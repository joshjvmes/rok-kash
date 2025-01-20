import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArbitrageParams {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  sellPrice: number;
}

interface ExchangeMetadata {
  maker_fee_percentage: number;
  taker_fee_percentage: number;
  withdrawal_fee_flat: number;
  avg_transfer_time_minutes: number;
  avg_network_latency_ms: number;
  historical_slippage_percentage: number;
  market_impact_factor: number;
}

interface ArbitrageCalculation {
  grossProfit: number;
  netProfit: number;
  executionTimeMs: number;
  costs: {
    buyExchangeFees: number;
    sellExchangeFees: number;
    transferFees: number;
    slippageCost: number;
    marketImpactCost: number;
  };
  metrics: {
    expectedSlippage: number;
    estimatedExecutionTime: number;
    liquidityScore: number;
    riskScore: number;
    confidenceScore: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { buyExchange, sellExchange, symbol, amount, buyPrice, sellPrice } = await req.json() as ArbitrageParams

    // Fetch exchange metadata for both exchanges
    const { data: exchangeMetadata, error: metadataError } = await supabase
      .from('exchange_metadata')
      .select('*')
      .in('exchange_name', [buyExchange, sellExchange])

    if (metadataError) {
      throw new Error(`Error fetching exchange metadata: ${metadataError.message}`)
    }

    const buyExchangeData = exchangeMetadata.find(e => e.exchange_name === buyExchange) as ExchangeMetadata
    const sellExchangeData = exchangeMetadata.find(e => e.exchange_name === sellExchange) as ExchangeMetadata

    // Calculate fees and costs
    const buyExchangeFees = amount * buyPrice * (buyExchangeData.taker_fee_percentage / 100)
    const sellExchangeFees = amount * sellPrice * (sellExchangeData.taker_fee_percentage / 100)
    const transferFees = buyExchangeData.withdrawal_fee_flat

    // Calculate slippage and market impact
    const expectedSlippage = Math.max(
      buyExchangeData.historical_slippage_percentage,
      sellExchangeData.historical_slippage_percentage
    )
    const slippageCost = amount * sellPrice * (expectedSlippage / 100)

    // Calculate market impact based on order size and exchange factors
    const marketImpactCost = amount * sellPrice * (
      (buyExchangeData.market_impact_factor + sellExchangeData.market_impact_factor) / 2 / 100
    )

    // Calculate execution time and latency
    const networkLatency = Math.max(
      buyExchangeData.avg_network_latency_ms,
      sellExchangeData.avg_network_latency_ms
    )
    const transferTime = (buyExchangeData.avg_transfer_time_minutes + sellExchangeData.avg_transfer_time_minutes) * 60 * 1000 // convert to ms

    // Calculate profits
    const grossProfit = (amount * sellPrice) - (amount * buyPrice)
    const totalCosts = buyExchangeFees + sellExchangeFees + transferFees + slippageCost + marketImpactCost
    const netProfit = grossProfit - totalCosts

    // Calculate risk and confidence scores
    const liquidityScore = calculateLiquidityScore(amount, buyPrice, sellPrice)
    const riskScore = calculateRiskScore(expectedSlippage, networkLatency, transferTime)
    const confidenceScore = calculateConfidenceScore(liquidityScore, riskScore, netProfit)

    const calculation: ArbitrageCalculation = {
      grossProfit,
      netProfit,
      executionTimeMs: networkLatency + transferTime,
      costs: {
        buyExchangeFees,
        sellExchangeFees,
        transferFees,
        slippageCost,
        marketImpactCost
      },
      metrics: {
        expectedSlippage,
        estimatedExecutionTime: networkLatency + transferTime,
        liquidityScore,
        riskScore,
        confidenceScore
      }
    }

    // Store the calculation in execution metrics
    const { error: insertError } = await supabase
      .from('arbitrage_execution_metrics')
      .insert({
        buy_exchange: buyExchange,
        sell_exchange: sellExchange,
        symbol,
        actual_slippage_percentage: expectedSlippage,
        execution_time_ms: networkLatency + transferTime,
        network_latency_ms: networkLatency,
        liquidity_depth: liquidityScore,
        market_impact_percentage: marketImpactCost / (amount * sellPrice) * 100
      })

    if (insertError) {
      console.error('Error storing execution metrics:', insertError)
    }

    return new Response(
      JSON.stringify(calculation),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in calculate-arbitrage function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Helper functions for calculating scores
function calculateLiquidityScore(amount: number, buyPrice: number, sellPrice: number): number {
  const orderSize = amount * ((buyPrice + sellPrice) / 2)
  // Simple liquidity score based on order size
  // 0-100 score where higher is better
  return Math.min(100, Math.max(0, 100 - (orderSize / 10000)))
}

function calculateRiskScore(slippage: number, latency: number, transferTime: number): number {
  // 0-100 score where lower is better (less risky)
  const slippageRisk = slippage * 20 // slippage has high weight
  const latencyRisk = (latency / 1000) * 10 // convert ms to seconds and weight
  const transferRisk = (transferTime / (60 * 1000)) * 5 // convert ms to minutes and weight
  return Math.min(100, Math.max(0, slippageRisk + latencyRisk + transferRisk))
}

function calculateConfidenceScore(liquidityScore: number, riskScore: number, netProfit: number): number {
  // 0-100 score where higher is better
  const profitScore = Math.min(100, Math.max(0, netProfit / 100)) // Scale profit to 0-100
  return Math.min(100, Math.max(0,
    (liquidityScore * 0.3) + // 30% weight for liquidity
    ((100 - riskScore) * 0.4) + // 40% weight for inverse of risk
    (profitScore * 0.3) // 30% weight for profit
  ))
}