import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchIPRanges();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">Supabase IP Ranges</h2>
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
                  No IP ranges found
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