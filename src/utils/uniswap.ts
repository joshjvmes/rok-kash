import { Token, TradeType, CurrencyAmount, Percent } from '@uniswap/sdk-core';
import { AlphaRouter } from '@uniswap/smart-order-router';
import { ethers } from 'ethers';

// Common tokens used in the application
export const TOKENS = {
  WETH: new Token(
    1, // mainnet
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  USDC: new Token(
    1,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    6,
    'USDC',
    'USD Coin'
  ),
};

export async function getUniswapPrice(
  inputToken: Token,
  outputToken: Token,
  inputAmount: string
) {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
    const router = new AlphaRouter({ chainId: 1, provider });

    const amount = CurrencyAmount.fromRawAmount(
      inputToken,
      ethers.utils.parseUnits(inputAmount, inputToken.decimals).toString()
    );

    const route = await router.route(
      amount,
      outputToken,
      TradeType.EXACT_INPUT,
      {
        recipient: ethers.constants.AddressZero,
        slippageTolerance: new Percent(5, 1000), // 0.5%
        type: 0 // 0 for universal router
      }
    );

    if (!route || !route.quote) {
      throw new Error('No route found');
    }

    return {
      price: route.quote.toFixed(outputToken.decimals),
      route: route.route[0],
      estimatedGasUsed: route.estimatedGasUsed.toString(),
    };
  } catch (error) {
    console.error('Error getting Uniswap price:', error);
    throw error;
  }
}