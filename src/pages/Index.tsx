import { QuickTrade } from "@/components/QuickTrade";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { TradingViewChart } from "@/components/TradingViewChart";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { PhantomWallet } from "@/components/PhantomWallet";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-4 transition-colors duration-200">
      <div className="flex justify-end mb-4">
        <PhantomWallet />
      </div>
      <div className="space-y-4">
        <TradingViewChart />
        <QuickTrade />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXCHANGES.map((exchange) => (
            <ExchangeBalance key={exchange} exchange={exchange} />
          ))}
        </div>
      </div>
      <ThemeSwitcher />
    </div>
  );
};

export default Index;