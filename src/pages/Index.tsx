import { useState } from "react";
import { QuickTrade } from "@/components/QuickTrade";
import { TradingHistory } from "@/components/TradingHistory";
import { OrderBook } from "@/components/OrderBook";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { TokenPricesTab } from "@/components/trading/TokenPricesTab";
import { fetchPrices, findArbitrageOpportunities } from "@/utils/exchange";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SYMBOLS = ['BTC/USDC', 'ETH/USDC', 'SOL/USDC', 'AVAX/USDC'];
const MEME_SYMBOLS = ['PEPE/USDC', 'BONK/USDC', 'MOG/USDC'];
const EXCHANGES = ['bybit', 'coinbase', 'kraken', 'binance'];

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prices = [], isLoading, refetch } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    enabled: !isPaused,
    refetchInterval: isPaused ? false : 300000, // 5 minutes
  });

  console.log('Raw prices data:', prices);

  // Group prices by symbol
  const groupedPrices = prices.reduce((acc, price) => {
    if (!acc[price.symbol]) {
      acc[price.symbol] = [];
    }
    acc[price.symbol].push(price);
    return acc;
  }, {} as Record<string, typeof prices>);

  console.log('Grouped prices:', groupedPrices);

  const { data: arbitrageOpportunities = [] } = useQuery({
    queryKey: ['arbitrageOpportunities', selectedSymbol],
    queryFn: () => findArbitrageOpportunities(selectedSymbol),
    enabled: !isPaused,
    refetchInterval: isPaused ? false : 5000,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast({
        title: "API Requests Paused",
        description: "All automatic data updates have been paused",
      });
    } else {
      toast({
        title: "API Requests Resumed",
        description: "Data updates have been resumed",
      });
      queryClient.invalidateQueries();
    }
  };

  return (
    <div className="min-h-screen bg-rokcat-purple-darker">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
            KASH
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={togglePause}
              variant="outline"
              size="icon"
              className={`h-8 w-8 md:h-9 md:w-9 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10 ${
                isPaused ? 'bg-rokcat-purple/10' : ''
              }`}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Main Tokens</TabsTrigger>
            <TabsTrigger value="meme">Meme Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <TokenPricesTab groupedPrices={groupedPrices} symbols={SYMBOLS} />
          </TabsContent>
          <TabsContent value="meme">
            <TokenPricesTab groupedPrices={groupedPrices} symbols={MEME_SYMBOLS} />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <QuickTrade />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EXCHANGES.map((exchange) => (
                <ExchangeBalance key={exchange} exchange={exchange} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <OrderBook exchange="coinbase" symbol={selectedSymbol} />
            <TradingHistory exchange="coinbase" symbol={selectedSymbol} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-rokcat-purple-light">
            Arbitrage Opportunities
          </h2>
          {arbitrageOpportunities.map((opportunity, index) => (
            <ArbitrageOpportunity key={index} {...opportunity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;