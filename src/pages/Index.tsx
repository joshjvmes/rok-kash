import { QuickTrade } from "@/components/QuickTrade";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { TradingViewChart } from "@/components/TradingViewChart";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

const Index = () => {
  return (
    <div className="space-y-4">
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