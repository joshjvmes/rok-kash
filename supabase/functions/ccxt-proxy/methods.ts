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
      return symbol; // KuCoin accepts standard format with '/'
    default:
      return symbol;
  }
}

async function safeExecuteMethod(exchange: Exchange, method: string, ...args: any[]) {
  try {
    console.log(`Executing ${method} on ${exchange.id} with args:`, args);
    // @ts-ignore - dynamic method call
    const result = await exchange[method](...args);
    console.log(`${method} result:`, result);
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
  try {
    const formattedSymbol = symbol ? formatExchangeSymbol(exchange.id, symbol) : symbol;
    console.log(`Executing ${method} for ${exchange.id} with symbol: ${formattedSymbol}`);

    switch (method) {
      case 'fetchTicker': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTicker');
        
        // For KuCoin, ensure the exchange is properly loaded before fetching
        if (exchange.id === 'kucoin') {
          await exchange.loadMarkets();
        }
        
        const result = await safeExecuteMethod(exchange, 'fetchTicker', formattedSymbol);
        if (!result.success) {
          console.error(`Failed to fetch ticker for ${formattedSymbol} on ${exchange.id}:`, result.error);
          return null;
        }
        return result.data;
      }

      case 'fetchMarkets': {
        const result = await safeExecuteMethod(exchange, 'fetchMarkets');
        if (!result.success) {
          console.error(`Failed to fetch markets on ${exchange.id}:`, result.error);
          return [];
        }
        return result.data;
      }

      case 'fetchBalance': {
        const result = await safeExecuteMethod(exchange, 'fetchBalance');
        if (!result.success) {
          console.error(`Failed to fetch balance on ${exchange.id}:`, result.error);
          return null;
        }
        return result.data;
      }

      case 'fetchOrderBook': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchOrderBook');
        const result = await safeExecuteMethod(exchange, 'fetchOrderBook', formattedSymbol, params.limit || 20);
        if (!result.success) {
          console.error(`Failed to fetch order book for ${formattedSymbol} on ${exchange.id}:`, result.error);
          return null;
        }
        return result.data;
      }

      case 'fetchTrades': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTrades');
        const result = await safeExecuteMethod(exchange, 'fetchTrades', formattedSymbol, undefined, params.limit || 50);
        if (!result.success) {
          console.error(`Failed to fetch trades for ${formattedSymbol} on ${exchange.id}:`, result.error);
          return null;
        }
        return result.data;
      }

      case 'fetchMarket': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchMarket');
        // For KuCoin, we need to fetch all markets and find the specific one
        const result = await safeExecuteMethod(exchange, 'fetchMarkets');
        if (!result.success) {
          console.error(`Failed to fetch markets on ${exchange.id}:`, result.error);
          return null;
        }
        const market = result.data.find((m: any) => m.symbol === formattedSymbol);
        if (!market) {
          console.error(`Market ${formattedSymbol} not found on ${exchange.id}`);
          return null;
        }
        return market;
      }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error(`Error in executeExchangeMethod for ${method} on ${exchange.id}:`, error);
    return null;
  }
}