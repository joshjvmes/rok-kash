import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface TradingPair {
  symbol: string;
  price: string;
  lastUpdated?: Date;
}

interface TradingPairsTableProps {
  pairs: TradingPair[];
  isLoading: boolean;
  onPairSelect: (symbol: string) => void;
}

export function TradingPairsTable({ pairs, isLoading, onPairSelect }: TradingPairsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-serenity-sky-dark" />
        <span className="ml-2 text-sm text-serenity-mountain">Loading trading pairs...</span>
      </div>
    );
  }

  return (
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
          {pairs.map((pair) => (
            <TableRow 
              key={pair.symbol}
              className="cursor-pointer hover:bg-serenity-sky-light/10"
              onClick={() => onPairSelect(pair.symbol)}
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
          {pairs.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-sm text-serenity-mountain">
                No trading pairs available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}