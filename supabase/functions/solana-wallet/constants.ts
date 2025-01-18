export const TOKEN_MINT_TO_CURRENCY: { [key: string]: string } = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
};

export const EXCHANGE_CONFIGS = {
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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};