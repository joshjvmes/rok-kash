import { Exchange } from 'npm:ccxt'

function formatExchangeSymbol(exchange: string, symbol: string): string {
  if (!symbol) return symbol;
  
  // Handle special cases for each exchange
  switch (exchange) {
    case 'bybit':
      return symbol.replace('/', '');
    case 'binance':
      return symbol.replace('/', '');
    case 'kucoin':
      return symbol; // Kucoin accepts standard format
    default:
      return symbol;
  }
}

async function safeExecuteMethod(exchange: Exchange, method: string, ...args: any[]) {
  try {
    // @ts-ignore - dynamic method call
    const result = await exchange[method](...args);
    return { success: true, data: result };
  } catch (error: any) {
    console.error(`Error executing ${method} on ${exchange.id}:`, error.message);
    return { 
      success: false, 
      error: `${exchange.id} ${error.message}`,
      code: error.code
    };
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
      case 'fetchTicker': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTicker');
        const result = await safeExecuteMethod(exchange, 'fetchTicker', formattedSymbol);
        if (!result.success) {
          console.log(`Failed to fetch ticker for ${formattedSymbol} on ${exchange.id}`);
          return null;
        }
        return result.data;
      }

      case 'fetchMarkets': {
        const result = await safeExecuteMethod(exchange, 'fetchMarkets');
        if (!result.success) {
          console.log(`Failed to fetch markets on ${exchange.id}`);
          return [];
        }
        return result.data;
      }

      case 'fetchBalance': {
        const result = await safeExecuteMethod(exchange, 'fetchBalance');
        if (!result.success) {
          console.log(`Failed to fetch balance on ${exchange.id}`);
          return null;
        }
        return result.data;
      }

      case 'fetchOrderBook': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchOrderBook');
        const result = await safeExecuteMethod(exchange, 'fetchOrderBook', formattedSymbol, params.limit || 20);
        if (!result.success) {
          console.log(`Failed to fetch order book for ${formattedSymbol} on ${exchange.id}`);
          return null;
        }
        return result.data;
      }

      case 'fetchTrades': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTrades');
        const result = await safeExecuteMethod(exchange, 'fetchTrades', formattedSymbol, undefined, params.limit || 50);
        if (!result.success) {
          console.log(`Failed to fetch trades for ${formattedSymbol} on ${exchange.id}`);
          return null;
        }
        return result.data;
      }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error(`Error in executeExchangeMethod for ${method} on ${exchange.id}:`, error);
    return null;
  }
}