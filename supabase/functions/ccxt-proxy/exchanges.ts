import { Exchange } from 'npm:ccxt'

export interface ExchangeConfig {
  apiKey?: string
  secret?: string
  options?: Record<string, any>
}

function sanitizeApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  // Remove any whitespace, newlines, and special characters
  return key.trim()
    .replace(/[\r\n]+/g, '') // Remove newlines
    .replace(/[^\w\-]/g, ''); // Remove special characters except alphanumeric and dash
}

function sanitizeSecret(secret: string | undefined): string | undefined {
  if (!secret) return undefined;
  
  // Remove whitespace and newlines but preserve base64/hex characters
  return secret.trim()
    .replace(/[\r\n]+/g, '') // Remove newlines
    .replace(/[^A-Za-z0-9+/=\-_]/g, ''); // Keep valid base64/hex chars
}

export function configureExchange(exchange: Exchange, exchangeId: string): void {
  try {
    switch (exchangeId) {
      case 'coinbase':
        const coinbaseKey = sanitizeApiKey(Deno.env.get('COINBASE_API_KEY'))
        const coinbaseSecret = sanitizeSecret(Deno.env.get('COINBASE_SECRET'))
        
        if (coinbaseKey && coinbaseSecret) {
          console.log('Configuring Coinbase with sanitized API credentials')
          exchange.apiKey = coinbaseKey
          exchange.secret = coinbaseSecret
          exchange.options = {
            ...exchange.options,
            createMarketBuyOrderRequiresPrice: false,
            version: 'v2',
          }
        } else {
          console.warn('No valid Coinbase API credentials found')
          throw new Error('Coinbase API credentials not configured or invalid')
        }
        break

      case 'kraken':
        const krakenKey = sanitizeApiKey(Deno.env.get('KRAKEN_API_KEY'))
        const krakenSecret = sanitizeSecret(Deno.env.get('KRAKEN_API_SECRET'))
        
        if (krakenKey && krakenSecret) {
          console.log('Configuring Kraken with sanitized API credentials')
          exchange.apiKey = krakenKey
          exchange.secret = krakenSecret
        } else {
          console.warn('No valid Kraken API credentials found')
          throw new Error('Kraken API credentials not configured or invalid')
        }
        break

      case 'bybit':
        const bybitKey = sanitizeApiKey(Deno.env.get('BYBIT_API_KEY'))
        const bybitSecret = sanitizeSecret(Deno.env.get('BYBIT_SECRET'))
        
        if (bybitKey && bybitSecret) {
          console.log('Configuring Bybit with sanitized API credentials')
          exchange.apiKey = bybitKey
          exchange.secret = bybitSecret
          exchange.options = {
            ...exchange.options,
            defaultType: 'spot',
          }
        } else {
          console.warn('No valid Bybit API credentials found')
          throw new Error('Bybit API credentials not configured or invalid')
        }
        break

      default:
        throw new Error(`Unsupported exchange: ${exchangeId}`)
    }
  } catch (error) {
    console.error(`Error configuring ${exchangeId} exchange:`, error)
    throw new Error(`Failed to configure ${exchangeId} exchange: ${error.message}`)
  }
}