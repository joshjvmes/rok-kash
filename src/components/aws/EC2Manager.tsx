import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';

interface EC2Instance {
  instanceId: string;
  state: string;
  publicDns: string;
  tags: { Key: string; Value: string; }[];
}

export function EC2Manager() {
  const { toast } = useToast();

  // Use React Query for data fetching with proper caching
  const { data: instances = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ec2-instances'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('aws-ec2', {
          body: { action: 'status' }
        });
        
        if (error) throw error;
        return data?.instances || [];
      } catch (err) {
        console.error('Error fetching EC2 instances:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const launchInstance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { action: 'launch' }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Launched new instance: ${data.instanceId}`,
      });
      
      // Refresh the instances list
      refetch();
    } catch (error) {
      console.error('Error launching instance:', error);
      toast({
        title: "Error",
        description: "Failed to launch EC2 instance",
        variant: "destructive",
      });
    }
  };

  if (error) {
    console.error('Error fetching instances:', error);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">EC2 Instances</h2>
        <Button 
          onClick={launchInstance} 
          disabled={isLoading}
        >
          Launch New Instance
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          Loading instances...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          Error loading instances. Please try again.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance: EC2Instance) => (
          <Card key={instance.instanceId} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">ID:</span>
                <span>{instance.instanceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">State:</span>
                <span className={
                  instance.state === 'running' ? 'text-green-500' :
                  instance.state === 'pending' ? 'text-yellow-500' :
                  'text-red-500'
                }>
                  {instance.state}
                </span>
              </div>
              {instance.publicDns && (
                <div className="flex justify-between">
                  <span className="font-medium">DNS:</span>
                  <span className="text-sm truncate">{instance.publicDns}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && !error && instances.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No instances found. Launch a new instance to get started.
        </div>
      )}
    </div>
  );
}