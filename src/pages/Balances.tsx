import { TotalExchangeBalance } from "@/components/TotalExchangeBalance";
import { PhantomWallet } from "@/components/PhantomWallet";
import { PhantomWalletBalances } from "@/components/PhantomWalletBalances";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Balances() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Exchange Balances</h2>
        <TotalExchangeBalance />
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Phantom Wallet</h2>
        <div className="space-y-4">
          <PhantomWallet />
          <Separator className="my-4" />
          <PhantomWalletBalances />
          <div className="text-sm text-muted-foreground">
            <p>Connect your Phantom wallet to view your Solana and SPL token balances.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}