import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

    // Fetch prices for all pairs
    const pairsWithPrices = await Promise.all(
      spotPairs.map(async (pair: TradingPair) => {
        const price = await fetchCCXTPrice('binance', pair.symbol);
        return {
          ...pair,
          price: price ? price.toFixed(8) : 'N/A'
        };
      })
    );

    return pairsWithPrices;
  } catch (error) {
    console.error('Error fetching Binance pairs:', error);
    throw error;
  }
}

export default function BinanceTest() {
  const { toast } = useToast();
  
  const { data: pairs, isLoading, error } = useQuery({
    queryKey: ['binance-pairs'],
    queryFn: fetchBinancePairs,
    refetchInterval: 30000, // Refresh every 30 seconds
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
      <h1 className="text-2xl font-bold mb-4">Binance API Testing</h1>
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