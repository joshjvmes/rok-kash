import { QuickTrade } from "@/components/QuickTrade";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { TradingViewChart } from "@/components/TradingViewChart";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import CommandTerminal from "@/components/CommandTerminal";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

const Index = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
        KASH Dashboard
      </h1>

      <CommandTerminal />

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