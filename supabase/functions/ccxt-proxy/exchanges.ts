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
  try {
    return decodeURIComponent(secret.trim());
  } catch (e) {
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
          console.log('Configuring Binance with API credentials')
          exchange.apiKey = binanceKey
          exchange.secret = binanceSecret
          exchange.options = {
            ...exchange.options,
            defaultType: 'spot',
            adjustForTimeDifference: true,
            recvWindow: 60000,
          }
        } else {
          console.log('No Binance API credentials found, using public API only')
        }
        break

      default:
        console.log(`No specific configuration for ${exchangeId}, using default settings`)
    }
  } catch (error) {
    console.error(`Error configuring ${exchangeId} exchange:`, error)
    throw error
  }
}