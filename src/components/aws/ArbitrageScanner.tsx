import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Pause, RefreshCw } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

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
  }>;
}

export function ArbitrageScanner() {
  const [isControlling, setIsControlling] = useState(false);
  const { toast } = useToast();

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['scanner-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { action: 'scanner-status' }
      });

      if (error) throw error;
      return data.status as ScannerStatus;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const controlScanner = async (action: 'start' | 'stop') => {
    try {
      setIsControlling(true);
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { action: `scanner-${action}` }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Scanner ${action}ed successfully`,
      });
      
      refetch();
    } catch (error) {
      console.error(`Error ${action}ing scanner:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} scanner`,
        variant: "destructive",
      });
    } finally {
      setIsControlling(false);
    }
  };

  if (error) {
    console.error('Error fetching scanner status:', error);
  }

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
              disabled={isControlling || isLoading || status?.status === 'running'}
            >
              {isControlling ? (
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
              disabled={isControlling || isLoading || status?.status === 'stopped'}
            >
              {isControlling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span className="ml-2">Stop</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isControlling}
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