import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TradingPair {
  symbol: string;
  price: string;
}

async function fetchBinancePairs() {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange: 'binance', 
        method: 'fetchMarkets'
      }
    });

    if (error) throw error;

    // Filter for spot markets and transform data
    const spotPairs = data
      .filter((market: any) => market.type === 'spot')
      .map((market: any) => ({
        symbol: market.symbol,
        price: '0' // Initialize price, will be fetched separately
      }));

    // Fetch prices sequentially
    const pairsWithPrices = [];
    for (const pair of spotPairs) {
      try {
        const price = await fetchCCXTPrice('binance', pair.symbol);
        pairsWithPrices.push({
          ...pair,
          price: price ? price.toFixed(8) : 'N/A'
        });
      } catch (error) {
        console.error(`Error fetching price for ${pair.symbol}:`, error);
        pairsWithPrices.push({
          ...pair,
          price: 'Error'
        });
      }
    }

    return pairsWithPrices;
  } catch (error) {
    console.error('Error fetching Binance pairs:', error);
    throw error;
  }
}

export default function BinanceTest() {
  const { toast } = useToast();
  
  const { data: pairs, isLoading, error, refetch } = useQuery({
    queryKey: ['binance-pairs'],
    queryFn: fetchBinancePairs,
    refetchOnWindowFocus: false, // Disable automatic refetching
    retry: 1,
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "Error fetching pairs",
      description: "Could not fetch trading pairs from Binance"
    });
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Binance API Testing</h1>
        <Button 
          onClick={() => refetch()} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Pairs
        </Button>
      </div>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Trading Pairs</h2>
        {isLoading ? (
          <p className="text-gray-400">Loading trading pairs...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trading Pair</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairs?.map((pair: TradingPair) => (
                  <TableRow key={pair.symbol}>
                    <TableCell>{pair.symbol}</TableCell>
                    <TableCell>{pair.price}</TableCell>
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