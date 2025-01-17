import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KucoinAccountInfo } from "@/components/KucoinAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "@/utils/exchanges/ccxt";

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

export default function KucoinTest() {
  const { toast } = useToast();
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Fetch balance data
  const { data: balanceData } = useQuery<BalanceData>({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin'),
    refetchInterval: 360000, // 6 minutes
  });

  useEffect(() => {
    async function fetchInitialPairs() {
      try {
        const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
          body: { 
            exchange: 'kucoin', 
            method: 'fetchMarkets'
          }
        });

        if (error) throw error;

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from API');
        }

        // Get coins we have balance for
        const nonZeroBalances = balanceData?.total ? 
          Object.entries(balanceData.total)
            .filter(([_, amount]) => amount > 0)
            .map(([coin]) => coin) : [];

        // Filter spot pairs that include our balance coins
        const spotPairs = data
          .filter((market: any) => {
            if (!(market && 
              typeof market === 'object' && 
              market.type === 'spot' && 
              market.symbol && 
              typeof market.symbol === 'string')) {
              return false;
            }
            
            // Split the symbol to get base and quote currencies
            const [base, quote] = market.symbol.split('/');
            // Keep pair if we have balance in either base or quote currency
            return nonZeroBalances.includes(base) || nonZeroBalances.includes(quote);
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

        console.log('Available pairs with balance:', spotPairs);
        setPairs(spotPairs);
        setSelectedPair(spotPairs[0].symbol);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Kucoin pairs:', error);
        toast({
          variant: "destructive",
          title: "Error fetching pairs",
          description: "Could not fetch trading pairs from Kucoin"
        });
        setIsLoading(false);
      }
    }

    fetchInitialPairs();
  }, [toast, balanceData]); // Added balanceData as dependency

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
        const price = await fetchCCXTPrice('kucoin', currentPair.symbol);
        
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

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Kucoin API Testing</h1>
      
      <div className="space-y-6">
        <KucoinAccountInfo />
        
        {selectedPair && (
          <TradingHistory exchange="kucoin" symbol={selectedPair} />
        )}
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Available Trading Pairs</h2>
          {isLoading ? (
            <p className="text-gray-400">Loading trading pairs...</p>
          ) : pairs.length === 0 ? (
            <p className="text-gray-400">No trading pairs available for your balance</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trading Pair</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map((pair, index) => (
                    <TableRow 
                      key={pair.symbol}
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedPair(pair.symbol)}
                    >
                      <TableCell>{pair.symbol}</TableCell>
                      <TableCell>{pair.price}</TableCell>
                      <TableCell>
                        {pair.lastUpdated 
                          ? new Date(pair.lastUpdated).toLocaleTimeString()
                          : 'Not yet updated'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
