import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Server } from "lucide-react";

export function ArbitrageClusterManager() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [isTestLaunching, setIsTestLaunching] = useState(false);
  const { toast } = useToast();

  const launchInstance = async () => {
    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { 
          action: 'launch'
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Launched new arbitrage scanner instance: ${data.instanceId}`,
      });
    } catch (error) {
      console.error('Error launching EC2 instance:', error);
      toast({
        title: "Error",
        description: "Failed to launch arbitrage scanner instance",
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const launchTestInstance = async () => {
    setIsTestLaunching(true);
    try {
      console.log('Attempting to launch test instance...');
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { 
          action: 'launch',
          test: true
        }
      });

      console.log('Launch response:', data, error);

      if (error) throw error;
      
      toast({
        title: "Test Launch Success",
        description: `Launched test instance: ${data.instanceId}`,
      });
    } catch (error) {
      console.error('Error launching test instance:', error);
      toast({
        title: "Test Launch Error",
        description: `Failed to launch test instance: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTestLaunching(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Arbitrage Scanner Cluster</h2>
          <div className="flex gap-2">
            <Button 
              onClick={launchInstance} 
              disabled={isLaunching}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
                </>
              ) : (
                'Launch Scanner Node'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={launchTestInstance}
              disabled={isTestLaunching}
            >
              {isTestLaunching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Test Launch
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Launch containerized arbitrage scanner nodes to monitor multiple exchanges simultaneously.
          Each node comes pre-configured with Docker and Node.js.
        </p>
      </div>
    </Card>
  );
}