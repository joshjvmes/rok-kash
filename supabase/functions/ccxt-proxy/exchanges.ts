import { Exchange } from 'npm:ccxt'

export interface ExchangeConfig {
  apiKey?: string
  secret?: string
  options?: Record<string, any>
}

export function configureExchange(exchange: Exchange, exchangeId: string): void {
  switch (exchangeId) {
    case 'coinbase':
      const coinbaseKey = Deno.env.get('COINBASE_API_KEY')
      const coinbaseSecret = Deno.env.get('COINBASE_SECRET')
      
      if (coinbaseKey && coinbaseSecret) {
        console.log('Configuring Coinbase with API credentials')
        exchange.apiKey = coinbaseKey
        exchange.secret = coinbaseSecret
        exchange.options = {
          ...exchange.options,
          createMarketBuyOrderRequiresPrice: false,
          version: 'v2',
        }
      } else {
        console.warn('No Coinbase API credentials found')
        throw new Error('Coinbase API credentials not configured')
      }
      break

    case 'kraken':
      const krakenKey = Deno.env.get('KRAKEN_API_KEY')
      const krakenSecret = Deno.env.get('KRAKEN_API_SECRET')
      
      if (krakenKey && krakenSecret) {
        console.log('Configuring Kraken with API credentials')
        exchange.apiKey = krakenKey
        exchange.secret = krakenSecret
      } else {
        console.warn('No Kraken API credentials found')
        throw new Error('Kraken API credentials not configured')
      }
      break

    case 'bybit':
      const bybitKey = Deno.env.get('BYBIT_API_KEY')
      const bybitSecret = Deno.env.get('BYBIT_SECRET')
      
      if (bybitKey && bybitSecret) {
        console.log('Configuring Bybit with API credentials')
        exchange.apiKey = bybitKey
        exchange.secret = bybitSecret
        exchange.options = {
          ...exchange.options,
          defaultType: 'spot',
        }
      } else {
        console.warn('No Bybit API credentials found')
        throw new Error('Bybit API credentials not configured')
      }
      break
  }
}