import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function KrakenTest() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testEndpoints = [
    { name: "Fetch Markets", endpoint: "fetchMarkets" },
    { name: "Fetch Balance", endpoint: "fetchBalance" },
    { name: "Fetch Order Book", endpoint: "fetchOrderBook" },
    { name: "Fetch Trades", endpoint: "fetchTrades" },
  ];

  const runTest = async (testName: string) => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch("/api/ccxt-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: "kraken",
          method: testName,
          symbol: testName === "fetchOrderBook" || testName === "fetchTrades" ? "BTC/USDT" : undefined,
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const data = await response.json();

      const testResult = {
        exchange_name: "kraken",
        test_name: testName,
        status: response.ok && !data.error,
        error_message: data.error || null,
        response_time: responseTime,
      };

      const { error } = await supabase
        .from("api_test_results")
        .insert([testResult]);

      if (error) {
        console.error("Error saving test result:", error);
        toast({
          title: "Error saving test result",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test completed",
          description: `${testName} test ${testResult.status ? "succeeded" : "failed"}`,
          variant: testResult.status ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error("Error running test:", error);
      toast({
        title: "Error running test",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kraken API Testing</h1>
      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid gap-4">
            {testEndpoints.map((test) => (
              <div key={test.endpoint} className="flex items-center justify-between">
                <Label>{test.name}</Label>
                <Button
                  onClick={() => runTest(test.endpoint)}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? "Testing..." : "Run Test"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}