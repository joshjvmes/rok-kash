import { Exchange } from 'npm:ccxt'

export async function executeExchangeMethod(
  exchange: Exchange,
  method: string,
  symbol?: string,
  params: any = {}
) {
  if (!exchange[method]) {
    throw new Error(`Unsupported method: ${method}`)
  }

  console.log(`Executing ${method} with params:`, { symbol, ...params })

  try {
    if (symbol) {
      return await exchange[method](symbol, params)
    }
    return await exchange[method](params)
  } catch (error) {
    console.error(`Error executing ${method}:`, error)
    throw error
  }
}