import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fetchBalance, fetchCCXTPrice } from "@/utils/exchanges/ccxt";

interface TradingPair {
  symbol: string;
  price: string;
  lastUpdated?: Date;
}

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

export function useOkxTradingPairs() {
  const { toast } = useToast();
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

  const { data: balanceData } = useQuery<BalanceData>({
    queryKey: ['balance', 'okx'],
    queryFn: () => fetchBalance('okx'),
    refetchInterval: 360000, // 6 minutes
  });

  useEffect(() => {
    async function fetchInitialPairs() {
      try {
        const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
          body: { 
            exchange: 'okx', 
            method: 'fetchMarkets'
          }
        });

        if (error) throw error;

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from API');
        }

        const nonZeroBalances = balanceData?.total ? 
          Object.entries(balanceData.total)
            .filter(([_, amount]) => amount > 0)
            .map(([coin]) => coin) : [];

        const spotPairs = data
          .filter((market: any) => {
            if (!(market && 
              typeof market === 'object' && 
              market.type === 'spot' && 
              market.symbol && 
              typeof market.symbol === 'string')) {
              return false;
            }
            
            const [base] = market.symbol.split('/');
            return nonZeroBalances.includes(base);
          })
          .map((market: any) => ({
            symbol: market.symbol,
            price: 'Loading...',
            lastUpdated: undefined
          }));

        if (spotPairs.length === 0) {
          console.log('No trading pairs found for coins with balance');
          setPairs([]);
          setIsLoading(false);
          return;
        }

        console.log('Available pairs with base currency balance:', spotPairs);
        setPairs(spotPairs);
        setSelectedPair(spotPairs[0].symbol);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching OKX pairs:', error);
        toast({
          variant: "destructive",
          title: "Error fetching pairs",
          description: "Could not fetch trading pairs from OKX"
        });
        setIsLoading(false);
      }
    }

    fetchInitialPairs();
  }, [toast, balanceData]);

  useEffect(() => {
    if (pairs.length === 0 || isLoading) return;

    const updatePrice = async () => {
      try {
        const currentPair = pairs[currentPairIndex];
        
        if (!currentPair || !currentPair.symbol) {
          console.error('Invalid pair data at index:', currentPairIndex);
          return;
        }

        console.log(`Fetching price for ${currentPair.symbol}`);
        const price = await fetchCCXTPrice('okx', currentPair.symbol);
        
        setPairs(currentPairs => {
          const newPairs = [...currentPairs];
          if (newPairs[currentPairIndex]) {
            newPairs[currentPairIndex] = {
              ...currentPair,
              price: price ? price.toFixed(8) : 'N/A',
              lastUpdated: new Date()
            };
          }
          return newPairs;
        });

        setCurrentPairIndex(current => 
          current === pairs.length - 1 ? 0 : current + 1
        );
      } catch (error) {
        console.error(`Error updating price for pair at index ${currentPairIndex}:`, error);
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [currentPairIndex, pairs.length, isLoading]);

  return {
    pairs,
    isLoading,
    selectedPair,
    setSelectedPair
  };
}