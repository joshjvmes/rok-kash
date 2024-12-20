import { Exchange } from 'npm:ccxt'

function formatBybitSymbol(symbol: string): string {
  console.log(`Original symbol: ${symbol}`);
  
  // Remove the slash and handle special cases for Bybit
  let formattedSymbol = symbol.replace('/', '');
  
  // Convert USDC pairs to USD for Bybit
  if (formattedSymbol.endsWith('USDC')) {
    formattedSymbol = formattedSymbol.replace('USDC', 'USD');
  }
  
  // For USD pairs, just keep the base currency and add USD
  if (formattedSymbol.endsWith('USD')) {
    const baseCurrency = formattedSymbol.replace('USD', '');
    formattedSymbol = `${baseCurrency}USD`;
  }
  
  console.log(`Formatted symbol for Bybit: ${formattedSymbol}`);
  return formattedSymbol;
}

async function fetchCoinbaseBalancePaginated(exchange: Exchange) {
  console.log('Fetching paginated Coinbase balance');
  let result: any = {};
  let params: any = {};
  let loop = true;

  do {
    try {
      const balance = await exchange.fetchBalance(params);
      console.log('Fetched balance page');
      
      const pagination = exchange.safeValue(balance.info, 'pagination');
      if (!pagination) {
        loop = false;
      } else {
        const nextStartingAfter = exchange.safeString(pagination, 'next_starting_after');
        if (nextStartingAfter) {
          params.starting_after = nextStartingAfter;
          console.log('Found next page, continuing...');
        } else {
          loop = false;
        }
      }
      
      result = exchange.deepExtend(result, balance);
    } catch (error) {
      console.error('Error fetching balance page:', error);
      throw error;
    }
  } while (loop);

  return result;
}

export async function executeExchangeMethod(
  exchange: Exchange,
  method: string,
  symbol?: string,
  params: Record<string, any> = {}
) {
  console.log(`Executing ${method} for ${symbol || 'no symbol'} on ${exchange.id}`);
  
  // Format symbol specifically for Bybit
  const formattedSymbol = exchange.id === 'bybit' && symbol ? formatBybitSymbol(symbol) : symbol;
  console.log(`Using formatted symbol: ${formattedSymbol}`);

  switch (method) {
    case 'fetchTicker':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchTicker');
      return await exchange.fetchTicker(formattedSymbol);

    case 'fetchOrderBook':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOrderBook');
      return await exchange.fetchOrderBook(formattedSymbol, params.limit || 20);

    case 'fetchOHLCV':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOHLCV');
      return await exchange.fetchOHLCV(formattedSymbol, params.timeframe || '1m');

    case 'fetchTrades':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchTrades');
      return await exchange.fetchTrades(formattedSymbol, undefined, params.limit || 50);

    case 'fetchMarkets':
      return await exchange.fetchMarkets();

    case 'fetchMarket':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchMarket');
      const markets = await exchange.fetchMarkets();
      const market = markets.find(m => m.symbol === formattedSymbol);
      if (!market) throw new Error(`Market not found for symbol: ${formattedSymbol}`);
      
      return {
        symbol: market.symbol,
        base: market.base,
        quote: market.quote,
        active: market.active,
        precision: market.precision,
        limits: market.limits,
        maker: market.maker || 0,
        taker: market.taker || 0,
        minNotional: market.limits?.cost?.min || null,
        maxNotional: market.limits?.cost?.max || null,
      };

    case 'fetchBalance':
      return await exchange.fetchBalance();

    case 'fetchBalancePaginated':
      if (exchange.id === 'coinbase') {
        return await fetchCoinbaseBalancePaginated(exchange);
      }
      throw new Error('Paginated balance fetching is only supported for Coinbase');

    case 'createOrder':
      if (!formattedSymbol || !params.side || !params.amount) {
        throw new Error('Missing required order parameters');
      }
      return await exchange.createOrder(
        formattedSymbol,
        params.type || 'limit',
        params.side,
        params.amount,
        params.price
      );

    case 'cancelOrder':
      if (!params.orderId || !formattedSymbol) {
        throw new Error('Order ID and symbol are required for cancelOrder');
      }
      return await exchange.cancelOrder(params.orderId, formattedSymbol);

    case 'fetchOrders':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOrders');
      return await exchange.fetchOrders(formattedSymbol);

    case 'fetchOpenOrders':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOpenOrders');
      return await exchange.fetchOpenOrders(formattedSymbol);

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}