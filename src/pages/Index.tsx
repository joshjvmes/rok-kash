import { PriceCard } from "@/components/PriceCard";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { QuickTrade } from "@/components/QuickTrade";

// Mock data - replace with real API data later
const prices = [
  { symbol: "BTC/USD", price: "43,567.89", change: 2.45, exchange: "Binance" },
  { symbol: "ETH/USD", price: "2,345.67", change: -1.23, exchange: "Coinbase" },
  { symbol: "SOL/USD", price: "89.12", change: 5.67, exchange: "Kraken" },
  { symbol: "AVAX/USD", price: "34.56", change: -0.89, exchange: "Bitfinex" },
];

const arbitrageOpps = [
  {
    buyExchange: "Binance",
    sellExchange: "Coinbase",
    symbol: "BTC/USD",
    spread: 0.45,
    potential: 234.56,
  },
  {
    buyExchange: "Kraken",
    sellExchange: "Bitfinex",
    symbol: "ETH/USD",
    spread: 0.32,
    potential: 156.78,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-trading-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Crypto Trading Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prices.map((price) => (
            <PriceCard key={`${price.symbol}-${price.exchange}`} {...price} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Arbitrage Opportunities</h2>
            {arbitrageOpps.map((opp) => (
              <ArbitrageOpportunity
                key={`${opp.symbol}-${opp.buyExchange}-${opp.sellExchange}`}
                {...opp}
              />
            ))}
          </div>
          <div>
            <QuickTrade />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;