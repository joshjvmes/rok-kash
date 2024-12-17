import { useEffect, useState } from "react";
import { PriceCard, PriceCardProps } from "@/components/PriceCard";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { QuickTrade } from "@/components/QuickTrade";
import { fetchPrices, findArbitrageOpportunities } from "@/utils/exchange";
import { useQuery } from "@tanstack/react-query";

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD'];
const REFRESH_INTERVAL = 10000; // 10 seconds

const Index = () => {
  const { data: prices = [], isLoading: pricesLoading } = useQuery<PriceCardProps[]>({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(SYMBOLS),
    refetchInterval: REFRESH_INTERVAL,
  });

  const { data: arbitrageOpps = [], isLoading: arbitrageLoading } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: findArbitrageOpportunities,
    refetchInterval: REFRESH_INTERVAL,
  });

  return (
    <div className="min-h-screen bg-trading-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Crypto Trading Dashboard</h1>
          {(pricesLoading || arbitrageLoading) && (
            <span className="text-sm text-gray-500">Updating...</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prices.map((price) => (
            <PriceCard 
              key={`${price.symbol}-${price.exchange}`}
              symbol={price.symbol}
              price={price.price}
              change={price.change}
              exchange={price.exchange}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Arbitrage Opportunities</h2>
            {arbitrageOpps.map((opp) => (
              <ArbitrageOpportunity
                key={`${opp.symbol}-${opp.buyExchange}-${opp.sellExchange}`}
                {...opp}
              />
            ))}
            {arbitrageOpps.length === 0 && !arbitrageLoading && (
              <p className="text-gray-500">No arbitrage opportunities found</p>
            )}
          </div>
          <div>
            <QuickTrade />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;