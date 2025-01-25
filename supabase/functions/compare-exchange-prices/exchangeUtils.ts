import ccxt from 'npm:ccxt';

export async function initializeExchanges(supportedExchanges: string[]) {
  const exchanges = [];
  
  for (const exchangeId of supportedExchanges) {
    try {
      const exchange = new ccxt[exchangeId.toLowerCase()]({
        enableRateLimit: true,
      });
      exchanges.push(exchange);
    } catch (error) {
      console.error(`Error initializing ${exchangeId}:`, error);
    }
  }
  
  return exchanges;
}

export async function findCommonSymbols(exchanges: ccxt.Exchange[]) {
  try {
    const symbolSets = await Promise.all(
      exchanges.map(async (exchange) => {
        try {
          await exchange.loadMarkets();
          return new Set(Object.keys(exchange.markets));
        } catch (error) {
          console.error(`Error loading markets for ${exchange.id}:`, error);
          return new Set();
        }
      })
    );

    // Start with the first exchange's symbols
    let commonSymbols = [...symbolSets[0]];

    // Find intersection with other exchanges
    for (let i = 1; i < symbolSets.length; i++) {
      commonSymbols = commonSymbols.filter(symbol => symbolSets[i].has(symbol));
    }

    // Add additional pairs if they exist on all exchanges
    const additionalPairs = [
      'AVAX/USDT', 'MATIC/USDT', 'DOT/USDT', 'LINK/USDT',
      'UNI/USDT', 'AAVE/USDT', 'ATOM/USDT', 'FTM/USDT',
      'NEAR/USDT', 'APE/USDT', 'ADA/USDT', 'XRP/USDT',
      'DOGE/USDT', 'SHIB/USDT', 'LTC/USDT', 'ETC/USDT'
    ];

    const validAdditionalPairs = additionalPairs.filter(pair => 
      symbolSets.every(symbols => symbols.has(pair))
    );

    console.log('Valid additional pairs:', validAdditionalPairs);
    
    return [...new Set([...commonSymbols, ...validAdditionalPairs])];
  } catch (error) {
    console.error('Error finding common symbols:', error);
    return [];
  }
}