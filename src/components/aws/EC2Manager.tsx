import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EC2Instance {
  instanceId: string;
  state: string;
  publicDns: string;
  tags: { Key: string; Value: string; }[];
}

export function EC2Manager() {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { action: 'status' }
      });

      if (error) throw error;
      setInstances(data.instances);
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch EC2 instances",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const launchInstance = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('aws-ec2', {
        body: { action: 'launch' }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Launched new instance: ${data.instanceId}`,
      });
      
      // Refresh the instances list
      fetchInstances();
    } catch (error) {
      console.error('Error launching instance:', error);
      toast({
        title: "Error",
        description: "Failed to launch EC2 instance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
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

      {instances.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No instances found. Launch a new instance to get started.
        </div>
      )}
    </div>
  );
}