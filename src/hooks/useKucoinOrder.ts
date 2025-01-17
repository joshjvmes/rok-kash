import { useState } from "react";
import { createOrder, cancelOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";

interface ActiveOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  status: string;
}

interface OrderResponse {
  id: string;
  status: string;
  amount: number;
}

interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export function useKucoinOrder() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const { toast } = useToast();

  const addTradeLog = (message: string, type: 'info' | 'success' | 'error') => {
    const timestamp = new Date().toLocaleTimeString();
    setTradeLogs(prev => [...prev, { timestamp, message, type }]);
    if (type === 'error') {
      console.error(message);
    } else if (type === 'success') {
      console.info(message);
    } else {
      console.log(message);
    }
  };

  const handleTrade = async (side: 'buy' | 'sell', selectedPair: string, amount: string) => {
    if (!selectedPair || !amount) {
      toast({
        title: "Error",
        description: "Please select a trading pair and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    addTradeLog(`Initiating ${side} order for ${amount} ${selectedPair}...`, 'info');

    try {
      const order = await createOrder('kucoin', selectedPair, 'market', side, numericAmount) as OrderResponse;
      
      if (!order || !order.id) {
        throw new Error('Order creation failed - no order ID received');
      }

      setActiveOrder({
        id: order.id,
        symbol: selectedPair,
        side,
        amount: numericAmount,
        status: order.status || 'pending'
      });
      
      const successMessage = `${side.toUpperCase()} order placed successfully for ${amount} ${selectedPair}`;
      toast({
        title: "Success",
        description: successMessage,
      });
      addTradeLog(successMessage, 'success');
      addTradeLog(`Order details: ${JSON.stringify(order)}`, 'info');
      
    } catch (error: any) {
      const errorMessage = `Failed to place ${side} order: ${error.message}`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      addTradeLog(errorMessage, 'error');
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) {
      addTradeLog('No active order to cancel', 'error');
      return;
    }

    try {
      addTradeLog(`Attempting to cancel order ${activeOrder.id}...`, 'info');
      await cancelOrder('kucoin', activeOrder.id, activeOrder.symbol);
      
      addTradeLog(`Successfully cancelled order ${activeOrder.id}`, 'success');
      toast({
        title: "Order Cancelled",
        description: `Successfully cancelled ${activeOrder.side} order for ${activeOrder.amount} ${activeOrder.symbol}`,
      });
      
      setActiveOrder(null);
    } catch (error: any) {
      const errorMessage = `Failed to cancel order: ${error.message}`;
      addTradeLog(errorMessage, 'error');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    activeOrder,
    tradeLogs,
    handleTrade,
    handleCancelOrder,
    addTradeLog
  };
}