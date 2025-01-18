import { TOKEN_MINT_TO_CURRENCY } from './constants.ts';

export async function getDepositAddress(exchange: string, tokenMint: string) {
  console.log(`Getting deposit address for ${exchange} and token ${tokenMint}`);
  
  try {
    // Initialize CCXT exchange instance
    const ccxt = await import('npm:ccxt');
    const config = {
      binance: {
        apiKey: Deno.env.get('BINANCE_API_KEY'),
        secret: Deno.env.get('BINANCE_SECRET')
      },
      kucoin: {
        apiKey: Deno.env.get('KUCOIN_API_KEY'),
        secret: Deno.env.get('KUCOIN_SECRET'),
        password: Deno.env.get('KUCOIN_PASSPHRASE')
      },
      okx: {
        apiKey: Deno.env.get('OKX_API_KEY'),
        secret: Deno.env.get('OKX_SECRET'),
        password: Deno.env.get('OKX_PASSPHRASE')
      },
      bybit: {
        apiKey: Deno.env.get('BYBIT_API_KEY'),
        secret: Deno.env.get('BYBIT_SECRET')
      },
      kraken: {
        apiKey: Deno.env.get('KRAKEN_API_KEY'),
        secret: Deno.env.get('KRAKEN_API_SECRET')
      }
    };

    const exchangeConfig = config[exchange.toLowerCase()];
    if (!exchangeConfig) {
      throw new Error(`Unsupported exchange: ${exchange}`);
    }

    const exchangeInstance = new ccxt[exchange.toLowerCase()]({
      ...exchangeConfig,
      enableRateLimit: true
    });

    const currency = TOKEN_MINT_TO_CURRENCY[tokenMint];
    if (!currency) {
      throw new Error(`Unsupported token mint: ${tokenMint}`);
    }

    console.log(`Fetching ${currency} deposit address from ${exchange}...`);
    const depositAddress = await exchangeInstance.fetchDepositAddress(currency, {
      network: 'SOL'
    });

    console.log('Deposit address:', depositAddress);
    return {
      address: depositAddress.address,
      tag: depositAddress.tag
    };
  } catch (error) {
    console.error('Error getting deposit address:', error);
    throw error;
  }
}