import { EXCHANGE_CONFIGS } from './constants.ts';

export async function getExchangeInstance(exchange: string) {
  console.log(`Initializing ${exchange} exchange instance...`);
  
  const config = EXCHANGE_CONFIGS[exchange.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported exchange: ${exchange}`);
  }

  try {
    const ccxt = await import('npm:ccxt');
    const exchangeClass = ccxt[exchange.toLowerCase()];
    
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchange} not found in CCXT`);
    }

    const instance = new exchangeClass({
      ...config,
      enableRateLimit: true
    });

    console.log(`Successfully initialized ${exchange} exchange instance`);
    return instance;
  } catch (error) {
    console.error(`Error initializing ${exchange} exchange:`, error);
    throw error;
  }
}