import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IPRange {
  id: string;
  ip_range: string;
  region: string | null;
  service: string | null;
  created_at: string;
  updated_at: string;
}

const SupabaseIPRanges = () => {
  const [ipRanges, setIpRanges] = useState<IPRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchIPRanges = async () => {
    try {
      console.log('Fetching IP ranges from database...');
      const { data, error } = await supabase
        .from('supabase_ip_ranges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.info(`Successfully fetched ${data?.length || 0} IP ranges`);
      setIpRanges(data || []);
    } catch (error) {
      console.error('Error fetching IP ranges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch IP ranges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshIPRanges = async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing IP ranges from Supabase API...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('fetch-ip-ranges', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      console.info('Successfully refreshed IP ranges');
      toast({
        title: "Success",
        description: "IP ranges refreshed successfully",
      });

      // Fetch the updated ranges
      await fetchIPRanges();
    } catch (error: any) {
      console.error('Error refreshing IP ranges:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh IP ranges",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIPRanges();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Supabase IP Ranges</h2>
          <Button 
            onClick={refreshIPRanges} 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse">Loading IP ranges...</div>
        ) : (
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">IP Range</th>
                    <th className="text-left p-2">Region</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {ipRanges.map((range) => (
                    <tr key={range.id} className="border-b">
                      <td className="p-2 font-mono">{range.ip_range}</td>
                      <td className="p-2">{range.region || '-'}</td>
                      <td className="p-2">{range.service || '-'}</td>
                      <td className="p-2">
                        {new Date(range.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ipRanges.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No IP ranges found. Click refresh to fetch the latest ranges.
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};

export default SupabaseIPRanges;