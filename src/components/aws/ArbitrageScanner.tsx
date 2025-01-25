import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Pause, RefreshCw } from "lucide-react";

interface ScannerStatus {
  status: 'running' | 'stopped' | 'error';
  lastUpdate: string;
  activeSymbols: string[];
  opportunities: number;
  opportunityDetails?: Array<{
    buyExchange: string;
    sellExchange: string;
    symbol: string;
    spread: number;
    potential: number;
    buyPrice?: number | null;
    sellPrice?: number | null;
  }>;
}

export function ArbitrageScanner() {
  const [status, setStatus] = useState<ScannerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchScannerStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { 
          action: 'scanner-status',
          checkAllPairs: true // Enable scanning all trading pairs
        }
      });

      if (error) throw error;
      
      setStatus(data.status);
      
      // Log any opportunities found with more detailed information
      if (data.status.opportunityDetails) {
        data.status.opportunityDetails.forEach((opp: any) => {
          console.info(
            `Found arbitrage opportunity:\n` +
            `Exchange Route: ${opp.buyExchange} -> ${opp.sellExchange}\n` +
            `Symbol: ${opp.symbol}\n` +
            `Spread: ${opp.spread.toFixed(2)}%\n` +
            `Potential Profit: $${opp.potential.toFixed(2)}\n` +
            `Buy Price: ${opp.buyPrice ? `$${opp.buyPrice.toFixed(2)}` : 'N/A'}\n` +
            `Sell Price: ${opp.sellPrice ? `$${opp.sellPrice.toFixed(2)}` : 'N/A'}`
          );
        });
      }
      
      console.log('Scanner status:', data.status);
    } catch (error) {
      console.error('Error fetching scanner status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scanner status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const controlScanner = async (action: 'start' | 'stop') => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { 
          action: `scanner-${action}`,
          checkAllPairs: true // Enable scanning all trading pairs when starting
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Scanner ${action}ed successfully`,
      });
      
      fetchScannerStatus();
    } catch (error) {
      console.error(`Error ${action}ing scanner:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} scanner`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScannerStatus();
    const interval = setInterval(fetchScannerStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Arbitrage Scanner Status</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => controlScanner('start')}
              disabled={isLoading || status?.status === 'running'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-2">Start</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => controlScanner('stop')}
              disabled={isLoading || status?.status === 'stopped'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span className="ml-2">Stop</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchScannerStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {status && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-sm font-medium ${
                status.status === 'running' ? 'text-green-500' :
                status.status === 'stopped' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {status.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Last Update:</span>
              <span className="text-sm">{new Date(status.lastUpdate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Active Symbols:</span>
              <span className="text-sm">{status.activeSymbols.join(', ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Opportunities Found:</span>
              <span className="text-sm font-medium">{status.opportunities}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}