import { Exchange } from 'npm:ccxt'

function formatExchangeSymbol(exchange: string, symbol: string): string {
  if (!symbol) return symbol;
  
  switch (exchange) {
    case 'bybit':
      return symbol.replace('/', '').replace('USDC', 'USD');
    case 'binance':
      return symbol.replace('/', '');
    default:
      return symbol;
  }
}

export async function executeExchangeMethod(
  exchange: Exchange,
  method: string,
  symbol?: string,
  params: Record<string, any> = {}
) {
  const formattedSymbol = symbol ? formatExchangeSymbol(exchange.id, symbol) : symbol;

  try {
    switch (method) {
      case 'fetchTicker':
        if (!formattedSymbol) throw new Error('Symbol required for fetchTicker');
        return await exchange.fetchTicker(formattedSymbol);

      case 'fetchMarkets':
        return await exchange.fetchMarkets();

      case 'fetchBalance':
        return await exchange.fetchBalance();

      case 'fetchOrderBook':
        if (!formattedSymbol) throw new Error('Symbol required for fetchOrderBook');
        return await exchange.fetchOrderBook(formattedSymbol, params.limit || 20);

      case 'fetchTrades':
        if (!formattedSymbol) throw new Error('Symbol required for fetchTrades');
        return await exchange.fetchTrades(formattedSymbol, undefined, params.limit || 50);

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error(`Error executing ${method} for ${formattedSymbol || 'no symbol'} on ${exchange.id}:`, error);
    throw error;
  }
}