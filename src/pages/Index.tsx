import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPrices, findArbitrageOpportunities } from "@/utils/exchange";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PriceGrid } from "@/components/dashboard/PriceGrid";
import { TradingSection } from "@/components/dashboard/TradingSection";
import { ArbitrageSection } from "@/components/dashboard/ArbitrageSection";

const SYMBOLS = ['BTC/USDC', 'ETH/USDC', 'SOL/USDC', 'AVAX/USDC'];

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [isPaused, setIsPaused] = useState(false);

  const { data: prices = [], isLoading, refetch } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    enabled: !isPaused,
    refetchInterval: isPaused ? false : 5000,
  });

  const { data: arbitrageOpportunities = [] } = useQuery({
    queryKey: ['arbitrageOpportunities', selectedSymbol],
    queryFn: () => findArbitrageOpportunities(selectedSymbol),
    enabled: !isPaused,
    refetchInterval: isPaused ? false : 5000,
  });

  // Group prices by symbol
  const groupedPrices = prices.reduce((acc, price) => {
    if (!acc[price.symbol]) {
      acc[price.symbol] = [];
    }
    acc[price.symbol].push(price);
    return acc;
  }, {} as Record<string, typeof prices>);

  return (
    <div className="min-h-screen bg-rokcat-purple-darker">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <DashboardHeader
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          isLoading={isLoading}
          onRefresh={refetch}
        />
        <PriceGrid groupedPrices={groupedPrices} />
        <TradingSection selectedSymbol={selectedSymbol} />
        <ArbitrageSection opportunities={arbitrageOpportunities} />
      </div>
    </div>
  );
};

export default Index;