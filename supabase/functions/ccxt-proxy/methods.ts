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

    // Load markets before executing any method to ensure proper symbol mapping
    if (['fetchBalance', 'fetchTicker', 'fetchOrderBook', 'fetchTrades'].includes(method)) {
      await exchange.loadMarkets();
    }

    switch (method) {
      case 'fetchTicker': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTicker');
        const result = await safeExecuteMethod(exchange, 'fetchTicker', formattedSymbol);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'fetchMarkets': {
        const result = await safeExecuteMethod(exchange, 'fetchMarkets');
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'fetchBalance': {
        const result = await safeExecuteMethod(exchange, 'fetchBalance');
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'fetchOrderBook': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchOrderBook');
        const result = await safeExecuteMethod(exchange, 'fetchOrderBook', formattedSymbol, params.limit || 20);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'fetchTrades': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchTrades');
        const result = await safeExecuteMethod(exchange, 'fetchTrades', formattedSymbol, undefined, params.limit || 50);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'fetchMarket': {
        if (!formattedSymbol) throw new Error('Symbol required for fetchMarket');
        const markets = await exchange.loadMarkets();
        const market = markets[formattedSymbol];
        if (!market) throw new Error(`Market ${formattedSymbol} not found on ${exchange.id}`);
        return market;
      }

      case 'createOrder': {
        if (!formattedSymbol) throw new Error('Symbol required for createOrder');
        const result = await safeExecuteMethod(
          exchange, 
          'createOrder', 
          formattedSymbol,
          params.type,
          params.side,
          params.amount,
          params.price,
          params.extra || {}
        );
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      case 'cancelOrder': {
        if (!formattedSymbol) throw new Error('Symbol required for cancelOrder');
        if (!params.id) throw new Error('Order ID required for cancelOrder');
        
        const result = await safeExecuteMethod(
          exchange,
          'cancelOrder',
          params.id,
          formattedSymbol
        );
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error(`Error in executeExchangeMethod for ${method} on ${exchange.id}:`, error);
    throw error;
  }
}