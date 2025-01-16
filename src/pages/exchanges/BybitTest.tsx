import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCCXTPrice, fetchMarketStructure } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TradingPair {
  symbol: string;
  price: string;
  lastUpdated?: Date;
  makerFee?: string;
  takerFee?: string;
}

export default function BybitTest() {
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
            exchange: 'bybit', 
            method: 'fetchMarkets'
          }
        });

        if (error) throw error;

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from API');
        }

        // Simplified filtering: just get first 10 spot trading pairs
        const spotPairs = data
          .filter((market: any) => {
            return (
              market && 
              typeof market === 'object' && 
              market.type === 'spot' && 
              market.symbol && 
              typeof market.symbol === 'string'
            );
          })
          .slice(0, 10); // Take first 10 pairs

        // Fetch market structure for each pair to get fees
        const pairsWithFees = await Promise.all(
          spotPairs.map(async (market: any) => {
            try {
              const marketStructure = await fetchMarketStructure('bybit', market.symbol);
              return {
                symbol: market.symbol,
                price: 'Loading...',
                lastUpdated: undefined,
                makerFee: marketStructure?.maker ? `${(marketStructure.maker * 100).toFixed(3)}%` : 'N/A',
                takerFee: marketStructure?.taker ? `${(marketStructure.taker * 100).toFixed(3)}%` : 'N/A'
              };
            } catch (error) {
              console.error(`Error fetching market structure for ${market.symbol}:`, error);
              return {
                symbol: market.symbol,
                price: 'Loading...',
                lastUpdated: undefined,
                makerFee: 'N/A',
                takerFee: 'N/A'
              };
            }
          })
        );

        if (pairsWithFees.length === 0) {
          throw new Error('No valid trading pairs found');
        }

        console.log('First 10 available pairs with fees:', pairsWithFees);
        setPairs(pairsWithFees);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Bybit pairs:', error);
        toast({
          variant: "destructive",
          title: "Error fetching pairs",
          description: "Could not fetch trading pairs from Bybit"
        });
        setIsLoading(false);
      }
    }

    fetchInitialPairs();
  }, [toast]);

  // Sequential price updates
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
        const price = await fetchCCXTPrice('bybit', currentPair.symbol);
        
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

        // Move to next pair or reset to first pair
        setCurrentPairIndex(current => 
          current === pairs.length - 1 ? 0 : current + 1
        );
      } catch (error) {
        console.error(`Error updating price for pair at index ${currentPairIndex}:`, error);
      }
    };

    // Update current pair immediately
    updatePrice();

    // Set up interval for the current pair
    const interval = setInterval(updatePrice, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentPairIndex, pairs.length, isLoading]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bybit Trading Pairs</h1>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Available Trading Pairs</h2>
        {isLoading ? (
          <p className="text-gray-400">Loading trading pairs...</p>
        ) : pairs.length === 0 ? (
          <p className="text-gray-400">No trading pairs available</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trading Pair</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Maker Fee</TableHead>
                  <TableHead>Taker Fee</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairs.map((pair) => (
                  <TableRow key={pair.symbol}>
                    <TableCell>{pair.symbol}</TableCell>
                    <TableCell>{pair.price}</TableCell>
                    <TableCell>{pair.makerFee}</TableCell>
                    <TableCell>{pair.takerFee}</TableCell>
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