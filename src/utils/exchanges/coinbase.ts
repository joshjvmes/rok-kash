/**
 * Coinbase API integration utilities
 * @module utils/exchanges/coinbase
 */

import { supabase } from "@/integrations/supabase/client";
import { Client } from '@coinbase/coinbase-sdk';
import { toast } from "@/hooks/use-toast";

/**
 * Error class for Coinbase API related errors
 */
class CoinbaseAPIError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'CoinbaseAPIError';
  }
}

/**
 * Fetches the current price for a given symbol from Coinbase
 * @param symbol - Trading pair symbol (e.g., 'BTC/USD')
 * @returns Promise<number | null> - Returns the price or null if there's an error
 * @throws {CoinbaseAPIError} When there's an error fetching the price
 */
export async function fetchCoinbasePrice(symbol: string): Promise<number | null> {
  try {
    // Use Edge Function to avoid CORS and API key exposure
    const { data, error } = await supabase.functions.invoke('coinbase-proxy', {
      body: { symbol }
    });

    if (error) {
      throw new CoinbaseAPIError('Error fetching Coinbase price', error);
    }

    if (!data?.data?.amount) {
      throw new CoinbaseAPIError('Invalid price data received from Coinbase');
    }

    return parseFloat(data.data.amount);
  } catch (error) {
    console.error('Error fetching Coinbase price:', error);
    
    // Show user-friendly error message
    toast({
      title: "Error",
      description: error instanceof CoinbaseAPIError 
        ? error.message 
        : "Failed to fetch Coinbase price",
      variant: "destructive",
    });
    
    return null;
  }
}

/**
 * Initialize Coinbase client with proper error handling
 * @param apiKey - Coinbase API key
 * @param apiSecret - Coinbase API secret
 * @returns Client instance or null if initialization fails
 */
export function initializeCoinbaseClient(apiKey: string, apiSecret: string): Client | null {
  try {
    if (!apiKey || !apiSecret) {
      throw new CoinbaseAPIError('Missing Coinbase API credentials');
    }

    // Sanitize API credentials
    const sanitizedKey = apiKey.trim();
    const sanitizedSecret = apiSecret.trim();

    return new Client({
      apiKey: sanitizedKey,
      apiSecret: sanitizedSecret,
      strictSSL: true // Enable strict SSL checking
    });
  } catch (error) {
    console.error('Error initializing Coinbase client:', error);
    toast({
      title: "Coinbase Client Error",
      description: "Failed to initialize Coinbase client. Please check your credentials.",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Validates Coinbase API response
 * @param response - Response from Coinbase API
 * @throws {CoinbaseAPIError} When response is invalid
 */
export function validateCoinbaseResponse(response: any): void {
  if (!response) {
    throw new CoinbaseAPIError('Empty response from Coinbase');
  }

  if (response.error) {
    throw new CoinbaseAPIError(`Coinbase API error: ${response.error}`);
  }
}