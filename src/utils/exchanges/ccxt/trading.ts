import { makeRequest } from './config';

export async function createOrder(
  exchange: string,
  symbol: string,
  type: 'market' | 'limit',
  side: 'buy' | 'sell',
  amount: number,
  price?: number
) {
  console.log(`Creating ${side} order on ${exchange} for ${symbol}`);
  
  const params: any = {
    symbol,
    type,
    side,
    amount,
  };

  if (type === 'limit' && price) {
    params.price = price;
  }

  const data = await makeRequest(exchange, 'createOrder', params);
  console.log(`Successfully created order on ${exchange}:`, data);
  return data;
}

export async function fetchBalance(exchange: string) {
  return await makeRequest(exchange, 'fetchBalance');
}