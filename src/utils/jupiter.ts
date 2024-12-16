/**
 * IMPORTANT NOTICE:
 * This file contains Jupiter (Jup-ag) DEX aggregator integration utilities.
 * Make sure to handle errors appropriately in production.
 */

import { Jupiter } from '@jup-ag/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { connection } from './solana';

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
    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(inputMint),
      outputMint: new PublicKey(outputMint),
      amount,
      slippageBps: slippage * 100, // Convert percentage to basis points
    });
    return routes.routesInfos;
  } catch (error) {
    console.error('Error getting Jupiter routes:', error);
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
    const routes = await getRoutes(inputMint, outputMint, amount);
    if (routes.length === 0) {
      throw new Error('No routes found');
    }
    return routes[0]; // Returns the best route (first route is always the best)
  } catch (error) {
    console.error('Error getting best Jupiter route:', error);
    throw new Error('Failed to get best swap route');
  }
}