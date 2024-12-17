/**
 * Coinbase Edge Function Proxy
 * Handles Coinbase API requests with proper error handling and rate limiting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Client } from 'npm:@coinbase/coinbase-sdk';

const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 30; // Maximum requests per minute

// Rate limiting state
const requestTimestamps: number[] = [];

interface RequestBody {
  symbol: string;
}

serve(async (req) => {
  try {
    // Rate limiting check
    const now = Date.now();
    requestTimestamps.push(now);
    const windowStart = now - RATE_LIMIT_WINDOW;
    while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length > MAX_REQUESTS) {
      throw new Error('Rate limit exceeded');
    }

    // Parse request body
    const { symbol } = await req.json() as RequestBody;

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Initialize Coinbase client
    const client = new Client({
      apiKey: Deno.env.get('COINBASE_API_KEY') || '',
      apiSecret: Deno.env.get('COINBASE_SECRET') || '',
    });

    if (!client) {
      throw new Error('Failed to initialize Coinbase client');
    }

    // Normalize symbol format (e.g., "BTC/USD" to "BTC-USD")
    const normalizedSymbol = symbol.replace('/', '-');

    // Make API request
    const response = await client.rest.exchange.listProducts();

    // Validate response
    if (!response || response.error) {
      throw new Error(`Coinbase API error: ${response?.error || 'Unknown error'}`);
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Coinbase proxy error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: error instanceof Error && error.message === 'Rate limit exceeded' ? 429 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});