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
import { RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ['BTC/USDC', 'ETH/USDC', 'SOL/USDC', 'AVAX/USDC'];
const EXCHANGES = ['coinbase', 'kraken', 'bybit'];

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { 
    data: prices = [], 
    isLoading: pricesLoading,
    refetch: refetchPrices
  } = useQuery<PriceCardProps[]>({
    queryKey: ['prices'],
    queryFn: fetchPrices.bind(null, SYMBOLS),
    enabled: true,
    refetchInterval: false,
  });

  const { 
    data: arbitrageOpps = [], 
    isLoading: arbitrageLoading,
    refetch: refetchArbitrage
  } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: findArbitrageOpportunities,
    enabled: true,
    refetchInterval: false,
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchPrices(),
      refetchArbitrage()
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
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
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
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
              <PriceCard 
                symbol={price.symbol}
                price={price.price}
                change={price.change}
                exchange={price.exchange}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OrderBook exchange="coinbase" symbol={selectedSymbol} />
              <OrderBook exchange="kraken" symbol={selectedSymbol} />
              <OrderBook exchange="bybit" symbol={selectedSymbol} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TradingHistory exchange="coinbase" symbol={selectedSymbol} />
              <TradingHistory exchange="kraken" symbol={selectedSymbol} />
              <TradingHistory exchange="bybit" symbol={selectedSymbol} />
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