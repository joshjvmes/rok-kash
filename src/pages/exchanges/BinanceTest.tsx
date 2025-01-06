import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TradingPair {
  symbol: string;
  price: string;
  lastUpdated?: Date;
}

export default function BinanceTest() {
  const { toast } = useToast();
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Fetch initial trading pairs
  useEffect(() => {
    async function fetchInitialPairs() {
      try {
        const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
          body: { 
            exchange: 'binance', 
            method: 'fetchMarkets'
          }
        });

        if (error) throw error;

        // Filter for spot markets, take only first 10 pairs
        const spotPairs = data
          .filter((market: any) => market.type === 'spot')
          .slice(0, 10) // Only take first 10 pairs
          .map((market: any) => ({
            symbol: market.symbol,
            price: 'Loading...',
            lastUpdated: undefined
          }));

        setPairs(spotPairs);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Binance pairs:', error);
        toast({
          variant: "destructive",
          title: "Error fetching pairs",
          description: "Could not fetch trading pairs from Binance"
        });
        setIsLoading(false);
      }
    }

    fetchInitialPairs();
  }, [toast]);

  // Sequential price updates
  useEffect(() => {
    if (pairs.length === 0) return;

    const updatePrice = async () => {
      try {
        const pair = pairs[currentPairIndex];
        const price = await fetchCCXTPrice('binance', pair.symbol);
        
        setPairs(currentPairs => {
          const newPairs = [...currentPairs];
          newPairs[currentPairIndex] = {
            ...pair,
            price: price ? price.toFixed(8) : 'N/A',
            lastUpdated: new Date()
          };
          return newPairs;
        });

        // Move to next pair or reset to first pair
        setCurrentPairIndex(current => 
          current === pairs.length - 1 ? 0 : current + 1
        );
      } catch (error) {
        console.error(`Error updating price for ${pairs[currentPairIndex].symbol}:`, error);
      }
    };

    // Update current pair immediately
    updatePrice();

    // Set up interval for the current pair
    const interval = setInterval(updatePrice, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentPairIndex, pairs.length]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Binance API Testing</h1>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Trading Pairs (Top 10)</h2>
        {isLoading ? (
          <p className="text-gray-400">Loading trading pairs...</p>
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
                  <TableRow key={pair.symbol}>
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
  );
}