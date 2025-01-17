import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ExchangeSelector } from "@/components/trading/ExchangeSelector";
import { TradeAmount } from "@/components/trading/TradeAmount";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

interface RebalanceTransaction {
  id: string;
  from_exchange: string;
  to_exchange: string;
  token_symbol: string;
  amount: number;
  status: string;
  created_at: string;
  transaction_hash?: string;
  error_message?: string;
}

export default function RebalancePage() {
  const { toast } = useToast();
  const [fromExchange, setFromExchange] = useState<string>("");
  const [toExchange, setToExchange] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch balances for both exchanges
  const { data: fromBalance, isLoading: isLoadingFromBalance } = useQuery<BalanceData>({
    queryKey: ['balance', fromExchange],
    queryFn: () => fetchBalance(fromExchange),
    enabled: !!fromExchange,
  });

  const { data: toBalance, isLoading: isLoadingToBalance } = useQuery<BalanceData>({
    queryKey: ['balance', toExchange],
    queryFn: () => fetchBalance(toExchange),
    enabled: !!toExchange,
  });

  // Fetch transaction history
  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['rebalance-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rebalance_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RebalanceTransaction[];
    },
  });

  // Get available tokens from the source exchange
  const availableTokens = fromBalance?.total
    ? Object.entries(fromBalance.total)
        .filter(([_, amount]) => amount > 0)
        .map(([token]) => token)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromExchange || !toExchange || !selectedToken || !amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from('rebalance_transactions').insert({
        user_id: user.id,
        from_exchange: fromExchange,
        to_exchange: toExchange,
        token_symbol: selectedToken,
        amount: parseFloat(amount),
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rebalance transaction initiated",
      });

      // Reset form
      setAmount("");
      await refetchTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create rebalance transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-serenity-mountain mb-6">Rebalance Assets</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Rebalance Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ExchangeSelector
              selectedExchange={fromExchange}
              onExchangeChange={setFromExchange}
            />

            <ExchangeSelector
              selectedExchange={toExchange}
              onExchangeChange={setToExchange}
            />

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="bg-trading-gray-light border-trading-gray-light">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TradeAmount
              amount={amount}
              onAmountChange={setAmount}
              isLoading={isSubmitting}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !fromExchange || !toExchange || !selectedToken || !amount}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Transfer
                </>
              ) : (
                "Transfer"
              )}
            </Button>
          </form>
        </Card>

        {/* Transaction History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-serenity-mountain mb-4">Transaction History</h2>
          <div className="space-y-4">
            {transactions?.map((tx) => (
              <div
                key={tx.id}
                className="p-4 border rounded-lg border-serenity-sky-light"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-serenity-mountain">
                      {tx.from_exchange} → {tx.to_exchange}
                    </p>
                    <p className="text-sm text-serenity-mountain">
                      {tx.amount} {tx.token_symbol}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                {tx.error_message && (
                  <p className="text-xs text-red-500 mt-2">{tx.error_message}</p>
                )}
                <p className="text-xs text-serenity-mountain mt-2">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {!transactions?.length && (
              <p className="text-sm text-serenity-mountain text-center">
                No transactions yet
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}