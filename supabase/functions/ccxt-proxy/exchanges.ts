import { Exchange } from 'npm:ccxt'

function sanitizeSecret(secret: string | undefined): string {
  if (!secret) return ''
  return secret.trim()
}

export async function configureExchange(exchange: Exchange, exchangeId: string) {
  try {
    switch (exchangeId) {
      case 'bybit': {
        const bybitKey = sanitizeSecret(Deno.env.get('BYBIT_API_KEY'))
        const bybitSecret = sanitizeSecret(Deno.env.get('BYBIT_SECRET'))
        
        if (bybitKey && bybitSecret) {
          console.log('Configuring Bybit with sanitized API credentials')
          exchange.apiKey = bybitKey
          exchange.secret = bybitSecret
          exchange.options = {
            ...exchange.options,
            createMarketBuyOrderRequiresPrice: false
          }
        } else {
          console.warn('No valid Bybit API credentials found')
        }
        break
      }
      
      case 'coinbase': {
        const coinbaseKey = sanitizeSecret(Deno.env.get('COINBASE_API_KEY'))
        const coinbaseSecret = sanitizeSecret(Deno.env.get('COINBASE_SECRET'))
        
        if (coinbaseKey && coinbaseSecret) {
          console.log('Configuring Coinbase Pro with sanitized API credentials')
          exchange.apiKey = coinbaseKey
          exchange.secret = coinbaseSecret
          exchange.options = {
            ...exchange.options,
            createMarketBuyOrderRequiresPrice: false,
            enableRateLimit: true,
          }
        } else {
          console.warn('No valid Coinbase API credentials found')
        }
        break
      }
      
      case 'kraken': {
        const krakenKey = sanitizeSecret(Deno.env.get('KRAKEN_API_KEY'))
        const krakenSecret = sanitizeSecret(Deno.env.get('KRAKEN_API_SECRET'))
        
        if (krakenKey && krakenSecret) {
          console.log('Configuring Kraken with sanitized API credentials')
          exchange.apiKey = krakenKey
          exchange.secret = krakenSecret
        } else {
          console.warn('No valid Kraken API credentials found')
        }
        break
      }
      
      default:
        console.warn(`No configuration available for exchange: ${exchangeId}`)
    }
  } catch (error) {
    console.error('Error configuring exchange:', error)
    throw error
  }
}