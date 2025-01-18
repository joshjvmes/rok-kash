import { TOKEN_MINT_TO_CURRENCY } from './constants.ts';
import { getExchangeInstance } from './exchanges.ts';

export async function getDepositAddress(exchange: string, tokenMint: string) {
  console.log(`Getting deposit address for ${exchange} and token ${tokenMint}`);
  
  try {
    const currency = TOKEN_MINT_TO_CURRENCY[tokenMint];
    if (!currency) {
      throw new Error(`Unsupported token mint: ${tokenMint}`);
    }

    const exchangeInstance = await getExchangeInstance(exchange);

    console.log(`Fetching ${currency} deposit address from ${exchange}...`);
    const depositAddress = await exchangeInstance.fetchDepositAddress(currency, {
      network: 'SOL'
    });

    console.log('Deposit address response:', depositAddress);
    
    if (!depositAddress?.address) {
      throw new Error(`No deposit address returned from ${exchange}`);
    }

    return {
      address: depositAddress.address,
      tag: depositAddress.tag
    };
  } catch (error) {
    console.error('Error getting deposit address:', error);
    throw error;
  }
}