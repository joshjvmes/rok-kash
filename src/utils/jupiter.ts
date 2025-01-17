/**
 * IMPORTANT NOTICE:
 * This file contains Jupiter (Jup-ag) DEX aggregator integration utilities.
 * 
 * KNOWN ISSUES AND LIMITATIONS:
 * 1. Type conflicts between JSBI and number types - amount parameters need conversion
 * 2. Potential version compatibility issues with @jup-ag/core beta versions
 * 3. Error handling for network issues and invalid parameters
 * 
 * USAGE NOTES:
 * - Always wrap Jupiter calls in try-catch blocks
 * - Convert number amounts to JSBI using JSBI.BigInt() before passing to Jupiter
 * - Test thoroughly on devnet before mainnet deployment
 */

import { Jupiter } from '@jup-ag/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { connection } from './solana';
import JSBI from 'jsbi';

/**
 * Initialize Jupiter instance
 * @returns Jupiter instance
 */
export async function initializeJupiter() {
  try {
    const jupiter = await Jupiter.load({
      connection,
      cluster: 'devnet', // or 'mainnet-beta' for production
      user: null // Will be set when performing swaps
    });
    return jupiter;
  } catch (error) {
    console.error('Error initializing Jupiter:', error);
    throw new Error('Failed to initialize Jupiter DEX aggregator');
  }
}

/**
 * Get routes for token swap
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param amount Amount in input token (in lamports)
 * @param slippage Slippage tolerance (default 1%)
 * @returns Array of possible routes
 */
export async function getRoutes(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage: number = 1
) {
  try {
    const jupiter = await initializeJupiter();
    // Convert number to BigInt string first, then create JSBI instance
    const amountBigInt = JSBI.BigInt(amount.toString());
    
    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(inputMint),
      outputMint: new PublicKey(outputMint),
      inputAmount: amountBigInt, // Use inputAmount instead of amount
      slippageBps: slippage * 100, // Convert percentage to basis points
    });
    return routes.routesInfos;
  } catch (error) {
    console.error('Error getting Jupiter routes:', error);
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Invalid mint')) {
        throw new Error('Invalid token mint address provided');
      } else if (error.message.includes('amount')) {
        throw new Error('Invalid amount provided - must be a positive number');
      }
    }
    throw new Error('Failed to get swap routes');
  }
}

/**
 * Get quote for best route
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param amount Amount in input token (in lamports)
 * @returns Best quote information
 */
export async function getBestRoute(
  inputMint: string,
  outputMint: string,
  amount: number
) {
  try {
    // Input validation
    if (!inputMint || !outputMint || amount <= 0) {
      throw new Error('Invalid input parameters');
    }

    const routes = await getRoutes(inputMint, outputMint, amount);
    if (routes.length === 0) {
      throw new Error('No routes found');
    }
    return routes[0]; // Returns the best route (first route is always the best)
  } catch (error) {
    console.error('Error getting best Jupiter route:', error);
    if (error instanceof Error) {
      throw error; // Preserve the specific error message
    }
    throw new Error('Failed to get best swap route');
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * try {
 *   const route = await getBestRoute(
 *     "inputTokenMintAddress",
 *     "outputTokenMintAddress",
 *     1000000 // amount in lamports
 *   );
 *   // Process route...
 * } catch (error) {
 *   console.error('Swap route error:', error);
 *   // Handle error appropriately
 * }
 */