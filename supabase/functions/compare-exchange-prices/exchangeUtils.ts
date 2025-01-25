import { Exchange } from 'npm:ccxt';

export async function initializeExchanges(exchanges: string[]): Promise<Exchange[]> {
  const initializedExchanges = exchanges.map(id => {
    const exchange = new ccxt[id]({
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      }
    });

    // Configure API credentials if available
    const apiKey = Deno.env.get(`${id.toUpperCase()}_API_KEY`);
    const secret = Deno.env.get(`${id.toUpperCase()}_SECRET`);
    const passphrase = Deno.env.get(`${id.toUpperCase()}_PASSPHRASE`);

    if (apiKey && secret) {
      exchange.apiKey = apiKey;
      exchange.secret = secret;
      if (passphrase) {
        exchange.password = passphrase;
      }
    }

    return exchange;
  });

  // Load markets for all exchanges in parallel
  await Promise.all(initializedExchanges.map(exchange => 
    exchange.loadMarkets().catch(error => {
      console.error(`Error loading markets for ${exchange.id}:`, error);
    })
  ));

  return initializedExchanges;
}

export async function findCommonSymbols(exchanges: Exchange[]): Promise<string[]> {
  const symbolsByExchange = new Map<string, Set<string>>();

  exchanges.forEach(exchange => {
    const symbols = new Set(Object.keys(exchange.markets || {}));
    symbolsByExchange.set(exchange.id, symbols);
  });

  const commonSymbols = new Set<string>();
  const allSymbols = new Set<string>();

  symbolsByExchange.forEach((symbols) => {
    symbols.forEach(symbol => allSymbols.add(symbol));
  });

  allSymbols.forEach(symbol => {
    let count = 0;
    symbolsByExchange.forEach((exchangeSymbols) => {
      if (exchangeSymbols.has(symbol)) count++;
    });
    if (count >= 2) commonSymbols.add(symbol);
  });

  return Array.from(commonSymbols);
}