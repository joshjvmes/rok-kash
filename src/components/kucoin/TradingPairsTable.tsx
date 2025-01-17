import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    return <p className="text-gray-400">Loading trading pairs...</p>;
  }

  if (pairs.length === 0) {
    return <p className="text-gray-400">No trading pairs available for your base currency balance</p>;
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
              className="cursor-pointer hover:bg-gray-100"
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
        </TableBody>
      </Table>
    </div>
  );
}