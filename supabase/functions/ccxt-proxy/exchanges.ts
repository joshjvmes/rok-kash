import { Exchange } from 'npm:ccxt'

export interface ExchangeConfig {
  apiKey?: string
  secret?: string
  options?: Record<string, any>
}

function sanitizeApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.trim();
}

function sanitizeSecret(secret: string | undefined): string | undefined {
  if (!secret) return undefined;
  // Decode URI components and trim whitespace
  try {
    return decodeURIComponent(secret.trim());
  } catch (e) {
    // If decoding fails, return the trimmed original
    return secret.trim();
  }
}

export async function configureExchange(exchange: Exchange, exchangeId: string): Promise<void> {
  try {
    switch (exchangeId) {
      case 'binance':
        const binanceKey = sanitizeApiKey(Deno.env.get('BINANCE_API_KEY'))
        const binanceSecret = sanitizeSecret(Deno.env.get('BINANCE_SECRET'))
        
        if (binanceKey && binanceSecret) {
          console.log('Configuring Binance with sanitized API credentials')
          exchange.apiKey = binanceKey
          exchange.secret = binanceSecret
          exchange.options = {
            ...exchange.options,
            defaultType: 'spot',
            adjustForTimeDifference: true,
            recvWindow: 60000,
          }
        } else {
          console.warn('No valid Binance API credentials found')
          throw new Error('Binance API credentials not configured or invalid')
        }
        break

      default:
        throw new Error(`Unsupported exchange: ${exchangeId}`)
    }
  } catch (error) {
    console.error(`Error configuring ${exchangeId} exchange:`, error)
    throw error
  }
}