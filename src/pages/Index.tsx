import { useState } from "react";
import { QuickTrade } from "@/components/QuickTrade";
import { ExchangeBalance } from "@/components/ExchangeBalance";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const EXCHANGES = ['bybit', 'coinbase', 'kraken', 'binance', 'kucoin', 'okx'];

const Index = () => {
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast({
        title: "API Requests Paused",
        description: "All automatic data updates have been paused",
      });
    } else {
      toast({
        title: "API Requests Resumed",
        description: "Data updates have been resumed",
      });
      queryClient.invalidateQueries();
    }
  };

  return (
    <div className="min-h-screen bg-rokcat-purple-darker">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
            KASH
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={togglePause}
              variant="outline"
              size="icon"
              className={`h-8 w-8 md:h-9 md:w-9 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10 ${
                isPaused ? 'bg-rokcat-purple/10' : ''
              }`}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <QuickTrade />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {EXCHANGES.map((exchange) => (
              <ExchangeBalance key={exchange} exchange={exchange} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;