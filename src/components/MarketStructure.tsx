import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchMarketStructure } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";

interface MarketStructureProps {
  exchange: string;
  symbol: string;
}

export function MarketStructure({ exchange, symbol }: MarketStructureProps) {
  const [marketData, setMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log(`Fetching market structure for ${exchange} - ${symbol}`);
        const data = await fetchMarketStructure(exchange.toLowerCase(), symbol);
        console.log('Market structure data:', data);
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching market structure:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [exchange, symbol]);

  if (isLoading) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  if (!marketData) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">No market structure data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{exchange} Market Structure</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Min Order Size:</span>
          <span>{marketData.limits?.amount?.min || 'N/A'}</span>
          
          <span className="text-gray-500">Max Order Size:</span>
          <span>{marketData.limits?.amount?.max || 'N/A'}</span>
          
          <span className="text-gray-500">Min Price:</span>
          <span>{marketData.limits?.price?.min || 'N/A'}</span>
          
          <span className="text-gray-500">Max Price:</span>
          <span>{marketData.limits?.price?.max || 'N/A'}</span>
          
          <span className="text-gray-500">Min Cost:</span>
          <span>{marketData.limits?.cost?.min || 'N/A'}</span>
          
          <span className="text-gray-500">Precision Amount:</span>
          <span>{marketData.precision?.amount || 'N/A'}</span>
          
          <span className="text-gray-500">Precision Price:</span>
          <span>{marketData.precision?.price || 'N/A'}</span>
        </div>
      </div>
    </Card>
  );
}