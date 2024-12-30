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

      case 'kucoin':
        const kucoinKey = sanitizeApiKey(Deno.env.get('KUCOIN_API_KEY'))
        const kucoinSecret = sanitizeSecret(Deno.env.get('KUCOIN_SECRET'))
        const kucoinPassphrase = Deno.env.get('KUCOIN_PASSPHRASE')?.trim()
        
        if (kucoinKey && kucoinSecret && kucoinPassphrase) {
          console.log('Configuring Kucoin with sanitized API credentials')
          exchange.apiKey = kucoinKey
          exchange.secret = kucoinSecret
          exchange.password = kucoinPassphrase
          exchange.options = {
            ...exchange.options,
            defaultType: 'spot',
            versions: {
              public: { get: ['2'] },
              private: { get: ['2'] },
            },
          }
          // Add debug logging
          console.log('Kucoin configuration complete:', {
            hasApiKey: !!exchange.apiKey,
            hasSecret: !!exchange.secret,
            hasPassphrase: !!exchange.password,
            options: exchange.options
          })
        } else {
          console.warn('No valid Kucoin API credentials found', {
            hasApiKey: !!kucoinKey,
            hasSecret: !!kucoinSecret,
            hasPassphrase: !!kucoinPassphrase
          })
          throw new Error('Kucoin API credentials not configured or invalid')
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