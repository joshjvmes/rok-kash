import { corsHeaders } from './constants.ts';
import { getExchangeInstance } from './exchanges.ts';

export async function getDepositAddress(exchange: string, tokenMint: string) {
  console.log(`Fetching deposit address for ${exchange} and token ${tokenMint}`);
  
  try {
    const exchangeInstance = await getExchangeInstance(exchange);
    if (!exchangeInstance) {
      throw new Error(`Failed to initialize ${exchange} exchange`);
    }

    // Map Solana token mints to exchange currency codes
    const currencyMap: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT'
    };

    const currency = currencyMap[tokenMint];
    if (!currency) {
      throw new Error(`Unsupported token mint: ${tokenMint}`);
    }

    console.log(`Fetching ${currency} deposit address from ${exchange}`);
    
    // Load markets to ensure exchange is properly initialized
    await exchangeInstance.loadMarkets();

    // Check if the currency is supported by the exchange
    if (!exchangeInstance.currencies[currency]) {
      throw new Error(`Currency ${currency} not supported by ${exchange}`);
    }

    // Fetch deposit address with network parameters
    const params = currency === 'SOL' ? { network: 'SOL' } : { network: 'SPL' };
    const response = await exchangeInstance.fetchDepositAddress(currency, params);
    
    console.log(`Deposit address response from ${exchange}:`, response);

    if (!response || !response.address) {
      throw new Error(`No deposit address returned from ${exchange}`);
    }

    return {
      address: response.address,
      tag: response.tag, // Some exchanges might return a tag/memo
      network: response.network || params.network
    };
  } catch (error) {
    console.error(`Error fetching deposit address from ${exchange}:`, error);
    throw error;
  }
}