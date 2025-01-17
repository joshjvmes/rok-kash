import { useState, useEffect } from 'react';
import { fetchCCXTPrice } from '@/utils/exchanges/ccxt';

export function useBinanceTradingPairs() {
  const [pairs, setPairs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPairs() {
      try {
        // For now, we'll use a static list of common trading pairs
        // This can be expanded later to fetch from the API
        const commonPairs = [
          'BTC/USDT',
          'ETH/USDT',
          'BNB/USDT',
          'SOL/USDT',
          'XRP/USDT',
          'ADA/USDT',
          'DOGE/USDT',
          'MATIC/USDT',
          'DOT/USDT',
          'AVAX/USDT'
        ];
        
        // Filter pairs that are actually available on Binance
        const availablePairs = [];
        for (const pair of commonPairs) {
          try {
            const price = await fetchCCXTPrice('binance', pair);
            if (price) {
              availablePairs.push(pair);
            }
          } catch (error) {
            console.error(`Error checking pair ${pair}:`, error);
          }
        }
        
        setPairs(availablePairs);
        if (availablePairs.length > 0 && !selectedPair) {
          setSelectedPair(availablePairs[0]);
        }
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPairs();
  }, []);

  return {
    pairs,
    isLoading,
    selectedPair,
    setSelectedPair
  };
}