import { ExchangeBalance } from "@/components/ExchangeBalance";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TotalExchangeBalance } from "@/components/TotalExchangeBalance";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-4 transition-colors duration-200">
      <div className="space-y-4">
        <TradingViewChart />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          <TotalExchangeBalance />
          {EXCHANGES.map((exchange) => (
            <ExchangeBalance key={exchange} exchange={exchange} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;