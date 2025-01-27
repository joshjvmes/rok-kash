import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { ExchangeSelector } from "@/components/trading/ExchangeSelector";
import { TradeAmount } from "@/components/trading/TradeAmount";
import { SymbolSelector } from "@/components/trading/SymbolSelector";
import { fetchBalance } from "@/utils/exchanges/ccxt";

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

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

export function RebalanceWidget() {
  const { toast } = useToast();
  const [fromExchange, setFromExchange] = useState<string>("");
  const [toExchange, setToExchange] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // Fetch balance for the selected 'from' exchange
  const { data: fromExchangeBalance, isLoading: isLoadingBalance } = useQuery<BalanceData>({
    queryKey: ['balance', fromExchange],
    queryFn: () => fetchBalance(fromExchange),
    enabled: !!fromExchange,
    refetchInterval: 360000, // 6 minutes
  });

  // Update available symbols when fromExchange balance changes
  useEffect(() => {
    if (fromExchangeBalance?.total) {
      const symbols = Object.entries(fromExchangeBalance.total)
        .filter(([_, balance]) => balance > 0)
        .map(([symbol]) => `${symbol}/USDC`);
      setAvailableSymbols(symbols);
      
      // Reset selected token if it's not in the new list of available symbols
      if (selectedToken && !symbols.includes(selectedToken)) {
        setSelectedToken("");
      }
    } else {
      setAvailableSymbols([]);
      setSelectedToken("");
    }
  }, [fromExchangeBalance, fromExchange]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: transaction, error: insertError } = await supabase
        .from('rebalance_transactions')
        .insert({
          user_id: user.id,
          from_exchange: fromExchange,
          to_exchange: toExchange,
          token_symbol: selectedToken,
          amount: parseFloat(amount),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: transferError } = await supabase.functions
        .invoke('rebalance-transfer', {
          body: {
            fromExchange,
            toExchange,
            token: selectedToken.split('/')[0], // Extract base token from trading pair
            amount: parseFloat(amount),
            transactionId: transaction.id
          }
        });

      if (transferError) throw transferError;

      toast({
        title: "Transfer Initiated",
        description: "Your transfer has been initiated successfully.",
      });

      setAmount("");
      await refetchTransactions();
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to initiate transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 bg-gradient-to-b from-serenity-white to-serenity-sky-light border-serenity-sky-dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ExchangeSelector
            selectedExchange={fromExchange}
            onExchangeChange={(value) => {
              setFromExchange(value);
              setSelectedToken(""); // Reset selected token when exchange changes
            }}
          />

          <ExchangeSelector
            selectedExchange={toExchange}
            onExchangeChange={setToExchange}
          />

          <SymbolSelector
            selectedSymbol={selectedToken}
            onSymbolChange={setSelectedToken}
            availableSymbols={availableSymbols}
            isLoading={isLoadingBalance}
          />

          <TradeAmount
            amount={amount}
            onAmountChange={setAmount}
            isLoading={isSubmitting}
          />

          <Button 
            type="submit" 
            className="w-full bg-serenity-mountain hover:bg-serenity-grass text-serenity-white transition-colors"
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

      <Card className="p-6 bg-serenity-white border-serenity-sky-dark">
        <h2 className="text-lg font-semibold mb-4 text-serenity-mountain">Transaction Status</h2>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {transactions?.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-lg border border-serenity-sky-dark bg-gradient-to-r from-serenity-sky-light to-serenity-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-serenity-mountain">
                    {tx.from_exchange} → {tx.to_exchange}
                  </p>
                  <p className="text-sm text-serenity-grass">
                    {tx.amount} {tx.token_symbol}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    tx.status === 'completed'
                      ? 'bg-serenity-grass-light text-serenity-grass'
                      : tx.status === 'pending'
                      ? 'bg-serenity-sky-light text-serenity-mountain'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              {tx.error_message && (
                <p className="text-xs text-red-500 mt-2">{tx.error_message}</p>
              )}
              <p className="text-xs text-serenity-mountain/60 mt-2">
                {new Date(tx.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {!transactions?.length && (
            <p className="text-sm text-serenity-mountain/60 text-center">
              No transactions yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}