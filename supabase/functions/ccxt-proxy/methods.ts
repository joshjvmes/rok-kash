import { Exchange } from 'npm:ccxt'

export async function executeExchangeMethod(
  exchange: Exchange,
  method: string,
  symbol?: string,
  params: Record<string, any> = {}
) {
  console.log(`Executing ${method} for ${symbol || 'no symbol'}`)
  
  switch (method) {
    case 'fetchTicker':
      if (!symbol) throw new Error('Symbol is required for fetchTicker')
      return await exchange.fetchTicker(symbol)

    case 'fetchOrderBook':
      if (!symbol) throw new Error('Symbol is required for fetchOrderBook')
      return await exchange.fetchOrderBook(symbol, params.limit || 20)

    case 'fetchOHLCV':
      if (!symbol) throw new Error('Symbol is required for fetchOHLCV')
      return await exchange.fetchOHLCV(symbol, params.timeframe || '1m')

    case 'fetchTrades':
      if (!symbol) throw new Error('Symbol is required for fetchTrades')
      return await exchange.fetchTrades(symbol, undefined, params.limit || 50)

    case 'fetchMarkets':
      return await exchange.fetchMarkets()

    case 'fetchBalance':
      return await exchange.fetchBalance()

    case 'createOrder':
      if (!symbol || !params.side || !params.amount) {
        throw new Error('Missing required order parameters')
      }
      return await exchange.createOrder(
        symbol,
        params.type || 'limit',
        params.side,
        params.amount,
        params.price
      )

    case 'cancelOrder':
      if (!params.orderId || !symbol) {
        throw new Error('Order ID and symbol are required for cancelOrder')
      }
      return await exchange.cancelOrder(params.orderId, symbol)

    case 'fetchOrders':
      if (!symbol) throw new Error('Symbol is required for fetchOrders')
      return await exchange.fetchOrders(symbol)

    case 'fetchOpenOrders':
      if (!symbol) throw new Error('Symbol is required for fetchOpenOrders')
      return await exchange.fetchOpenOrders(symbol)

    default:
      throw new Error(`Unsupported method: ${method}`)
  }
}