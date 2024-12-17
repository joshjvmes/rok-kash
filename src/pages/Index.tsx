import { useEffect, useState } from "react";
import { PriceCard, PriceCardProps } from "@/components/PriceCard";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { QuickTrade } from "@/components/QuickTrade";
import { OrderBook } from "@/components/OrderBook";
import { TradingHistory } from "@/components/TradingHistory";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { fetchPrices, findArbitrageOpportunities } from "@/utils/exchange";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD'];
const EXCHANGES = ['coinbase', 'kraken'];
const REFRESH_INTERVAL = 30000; // 30 seconds

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const { toast } = useToast();

  const { 
    data: prices = [], 
    isLoading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices
  } = useQuery<PriceCardProps[]>({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(SYMBOLS),
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
    onError: (error) => {
      toast({
        title: "Error fetching prices",
        description: "Unable to fetch latest prices. Will retry automatically.",
        variant: "destructive",
      });
      console.error('Price fetch error:', error);
    }
  });

  const { 
    data: arbitrageOpps = [], 
    isLoading: arbitrageLoading,
    error: arbitrageError,
    refetch: refetchArbitrage
  } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: findArbitrageOpportunities,
    refetchInterval: REFRESH_INTERVAL,
    retry: 2,
    onError: (error) => {
      toast({
        title: "Error fetching arbitrage opportunities",
        description: "Unable to fetch arbitrage data. Will retry automatically.",
        variant: "destructive",
      });
      console.error('Arbitrage fetch error:', error);
    }
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchPrices(),
        refetchArbitrage()
      ]);
      toast({
        title: "Data refreshed",
        description: "Latest market data has been fetched.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-trading-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Crypto Trading Dashboard</h1>
          <div className="flex items-center gap-2">
            {(pricesLoading || arbitrageLoading) && (
              <span className="text-sm text-gray-500">Updating...</span>
            )}
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pricesLoading || arbitrageLoading}
            >
              <RefreshCw className={`h-4 w-4 ${pricesLoading || arbitrageLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prices.map((price) => (
            <div 
              key={`${price.symbol}-${price.exchange}`}
              onClick={() => setSelectedSymbol(price.symbol)}
              className="cursor-pointer"
            >
              <PriceCard {...price} />
            </div>
          ))}
          {prices.length === 0 && !pricesLoading && (
            <div className="col-span-full text-center text-gray-500">
              No price data available
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OrderBook exchange="coinbase" symbol={selectedSymbol} />
              <OrderBook exchange="kraken" symbol={selectedSymbol} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TradingHistory exchange="coinbase" symbol={selectedSymbol} />
              <TradingHistory exchange="kraken" symbol={selectedSymbol} />
            </div>

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
          <div className="space-y-4">
            <QuickTrade />
            {EXCHANGES.map((exchange) => (
              <ExchangeBalance key={exchange} exchange={exchange} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;