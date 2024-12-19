import { Exchange } from 'npm:ccxt'

function formatBybitSymbol(symbol: string): string {
  // Convert USD pairs to USDT for Bybit
  return symbol.replace('/USD', '/USDT');
}

export async function executeExchangeMethod(
  exchange: Exchange,
  method: string,
  symbol?: string,
  params: Record<string, any> = {}
) {
  console.log(`Executing ${method} for ${symbol || 'no symbol'} on ${exchange.id}`)
  
  // Convert symbol for Bybit
  const formattedSymbol = exchange.id === 'bybit' && symbol ? formatBybitSymbol(symbol) : symbol;
  console.log(`Using formatted symbol: ${formattedSymbol}`)

  switch (method) {
    case 'fetchTicker':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchTicker')
      return await exchange.fetchTicker(formattedSymbol)

    case 'fetchOrderBook':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOrderBook')
      return await exchange.fetchOrderBook(formattedSymbol, params.limit || 20)

    case 'fetchOHLCV':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOHLCV')
      return await exchange.fetchOHLCV(formattedSymbol, params.timeframe || '1m')

    case 'fetchTrades':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchTrades')
      return await exchange.fetchTrades(formattedSymbol, undefined, params.limit || 50)

    case 'fetchMarkets':
      return await exchange.fetchMarkets()

    case 'fetchMarket':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchMarket')
      const markets = await exchange.fetchMarkets()
      const market = markets.find(m => m.symbol === formattedSymbol)
      if (!market) throw new Error(`Market not found for symbol: ${formattedSymbol}`)
      
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
      }

    case 'fetchBalance':
      return await exchange.fetchBalance()

    case 'createOrder':
      if (!formattedSymbol || !params.side || !params.amount) {
        throw new Error('Missing required order parameters')
      }
      return await exchange.createOrder(
        formattedSymbol,
        params.type || 'limit',
        params.side,
        params.amount,
        params.price
      )

    case 'cancelOrder':
      if (!params.orderId || !formattedSymbol) {
        throw new Error('Order ID and symbol are required for cancelOrder')
      }
      return await exchange.cancelOrder(params.orderId, formattedSymbol)

    case 'fetchOrders':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOrders')
      return await exchange.fetchOrders(formattedSymbol)

    case 'fetchOpenOrders':
      if (!formattedSymbol) throw new Error('Symbol is required for fetchOpenOrders')
      return await exchange.fetchOpenOrders(formattedSymbol)

    default:
      throw new Error(`Unsupported method: ${method}`)
  }
}