import ccxt from 'npm:ccxt';

const exchangeConfigs = {
  binance: {
    apiKey: Deno.env.get('BINANCE_API_KEY'),
    secret: Deno.env.get('BINANCE_SECRET'),
    enableRateLimit: true,
    options: {
      defaultType: 'spot',
      adjustForTimeDifference: true,
    }
  },
  kucoin: {
    apiKey: Deno.env.get('KUCOIN_API_KEY'),
    secret: Deno.env.get('KUCOIN_SECRET'),
    password: Deno.env.get('KUCOIN_PASSPHRASE'),
    enableRateLimit: true,
    options: {
      defaultType: 'spot',
      versions: {
        public: { 
          'GET': {
            'deposit-address': 'v1',
          }
        }
      }
    }
  },
  bybit: {
    apiKey: Deno.env.get('BYBIT_API_KEY'),
    secret: Deno.env.get('BYBIT_SECRET'),
    enableRateLimit: true,
    options: {
      defaultType: 'spot'
    }
  },
  kraken: {
    apiKey: Deno.env.get('KRAKEN_API_KEY'),
    secret: Deno.env.get('KRAKEN_API_SECRET'),
    enableRateLimit: true
  },
  okx: {
    apiKey: Deno.env.get('OKX_API_KEY'),
    secret: Deno.env.get('OKX_SECRET'),
    password: Deno.env.get('OKX_PASSPHRASE'),
    enableRateLimit: true,
    options: {
      defaultType: 'spot'
    }
  }
};

export async function getExchangeInstance(exchangeName: string) {
  console.log(`Initializing ${exchangeName} exchange`);
  
  const config = exchangeConfigs[exchangeName as keyof typeof exchangeConfigs];
  if (!config) {
    throw new Error(`Unsupported exchange: ${exchangeName}`);
  }

  if (!config.apiKey || !config.secret) {
    throw new Error(`Missing API credentials for ${exchangeName}`);
  }

  const ExchangeClass = ccxt[exchangeName as keyof typeof ccxt];
  if (!ExchangeClass) {
    throw new Error(`Exchange ${exchangeName} not found in CCXT`);
  }

  try {
    const exchange = new ExchangeClass(config);
    console.log(`Successfully initialized ${exchangeName} exchange`);
    return exchange;
  } catch (error) {
    console.error(`Error initializing ${exchangeName} exchange:`, error);
    throw error;
  }
}