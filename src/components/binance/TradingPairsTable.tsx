import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface TradingPairsTableProps {
  pairs: string[];
  isLoading: boolean;
  onPairSelect: (pair: string) => void;
}

export function TradingPairsTable({ pairs, isLoading, onPairSelect }: TradingPairsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-serenity-sky-dark" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trading Pair</TableHead>
            <TableHead>Base Asset</TableHead>
            <TableHead>Quote Asset</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => {
            const [baseAsset, quoteAsset] = pair.split('/');
            return (
              <TableRow
                key={pair}
                className="cursor-pointer hover:bg-serenity-sky-light"
                onClick={() => onPairSelect(pair)}
              >
                <TableCell className="font-medium">{pair}</TableCell>
                <TableCell>{baseAsset}</TableCell>
                <TableCell>{quoteAsset}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}