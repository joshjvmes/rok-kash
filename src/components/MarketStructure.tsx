import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStructure } from "@/utils/exchanges/ccxt";
import { Loader2, DollarSign, Scale, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MarketStructureProps {
  symbol: string;
  exchange: string;
}

export function MarketStructure({ symbol, exchange }: MarketStructureProps) {
  const { data: marketInfo, isLoading } = useQuery({
    queryKey: ['marketStructure', exchange, symbol],
    queryFn: () => fetchMarketStructure(exchange, symbol),
  });

  if (isLoading) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  if (!marketInfo) {
    return null;
  }

  return (
    <Card className="p-6 bg-serenity-white">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-serenity-mountain flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Market Structure - {exchange}
          </h3>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-serenity-sky-dark" />
            <span className="text-sm text-serenity-mountain">{symbol}</span>
          </div>
        </div>

        <div className="bg-serenity-sky-light/10 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-serenity-mountain mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Fee Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-xs text-serenity-mountain/70">Maker Fee</p>
              <p className="text-lg font-semibold text-serenity-mountain">
                {(marketInfo.maker * 100).toFixed(3)}%
              </p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-xs text-serenity-mountain/70">Taker Fee</p>
              <p className="text-lg font-semibold text-serenity-mountain">
                {(marketInfo.taker * 100).toFixed(3)}%
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-serenity-mountain/70">Min Order Size</p>
            <p className="font-medium text-serenity-mountain">
              {marketInfo.limits?.amount?.min || 'N/A'} {symbol.split('/')[0]}
            </p>
          </div>
          <div>
            <p className="text-serenity-mountain/70">Max Order Size</p>
            <p className="font-medium text-serenity-mountain">
              {marketInfo.limits?.amount?.max || 'N/A'} {symbol.split('/')[0]}
            </p>
          </div>
          <div>
            <p className="text-serenity-mountain/70">Price Precision</p>
            <p className="font-medium text-serenity-mountain">
              {marketInfo.precision?.price || 'N/A'} decimals
            </p>
          </div>
          <div>
            <p className="text-serenity-mountain/70">Amount Precision</p>
            <p className="font-medium text-serenity-mountain">
              {marketInfo.precision?.amount || 'N/A'} decimals
            </p>
          </div>
          <div>
            <p className="text-serenity-mountain/70">Min Notional</p>
            <p className="font-medium text-serenity-mountain">
              ${marketInfo.limits?.cost?.min || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}