import { useState } from "react";
import { QuickTrade } from "@/components/QuickTrade";
import { TradingHistory } from "@/components/TradingHistory";
import { OrderBook } from "@/components/OrderBook";
import { PriceCard } from "@/components/PriceCard";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
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

  const { data: prices = [], isLoading, refetch: refetchData } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
  });

  const { data: arbitrageOpportunities = [] } = useQuery({
    queryKey: ['arbitrageOpportunities', selectedSymbol],
    queryFn: () => findArbitrageOpportunities(selectedSymbol),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-rokcat-purple-darker">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
            Trading Dashboard
          </h1>
          <div className="flex gap-4">
            <Button
              onClick={refetchData}
              variant="outline"
              size="sm"
              className="gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prices.map((price) => (
            <PriceCard key={`${price.exchange}-${price.symbol}`} {...price} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <QuickTrade />
            <ExchangeBalance exchange="coinbase" />
          </div>
          <div className="space-y-6">
            <OrderBook exchange="coinbase" symbol={selectedSymbol} />
            <TradingHistory exchange="coinbase" symbol={selectedSymbol} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-rokcat-purple-light">Arbitrage Opportunities</h2>
          {arbitrageOpportunities.map((opportunity, index) => (
            <ArbitrageOpportunity key={index} {...opportunity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
