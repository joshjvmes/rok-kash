import { useState, useEffect } from "react";
import { Settings, RefreshCw, Plus, Minus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface TradingPair {
  id: string;
  symbol: string;
  is_active: boolean;
}

interface ArbitrageSettings {
  symbols: string[];
  min_spread_percentage: number;
  min_profit_amount: number;
  exchanges: string[];
  refresh_interval: number;
  notifications_enabled: boolean;
  user_id?: string;
}

export function ArbitrageSettings() {
  const [settings, setSettings] = useState<ArbitrageSettings>({
    symbols: ["BTC/USDT"],
    min_spread_percentage: 0.1,
    min_profit_amount: 10.0,
    exchanges: ["Binance", "Kucoin"],
    refresh_interval: 30,
    notifications_enabled: true,
  });
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchTradingPairs();
  }, []);

  const fetchTradingPairs = async () => {
    try {
      const { data, error } = await supabase
        .from("matching_trading_pairs")
        .select("*")
        .order("symbol");

      if (error) throw error;
      setTradingPairs(data || []);
    } catch (error) {
      console.error("Error fetching trading pairs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trading pairs",
        variant: "destructive",
      });
    }
  };

  const toggleTradingPair = async (pairId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("matching_trading_pairs")
        .update({ is_active: !currentStatus })
        .eq("id", pairId);

      if (error) throw error;

      setTradingPairs(pairs =>
        pairs.map(pair =>
          pair.id === pairId
            ? { ...pair, is_active: !currentStatus }
            : pair
        )
      );

      toast({
        title: "Success",
        description: `Trading pair ${currentStatus ? "disabled" : "enabled"}`,
      });
    } catch (error) {
      console.error("Error toggling trading pair:", error);
      toast({
        title: "Error",
        description: "Failed to update trading pair status",
        variant: "destructive",
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("arbitrage_settings")
        .select("*")
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("arbitrage_settings")
        .upsert({
          ...settings,
          user_id: user.id
        }, { 
          onConflict: "user_id"
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your arbitrage monitoring settings have been updated.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Arbitrage Monitoring Settings</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-4">
            <Label>Active Trading Pairs</Label>
            <div className="space-y-2">
              {tradingPairs.map((pair) => (
                <div key={pair.id} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                  <span>{pair.symbol}</span>
                  <Button
                    variant={pair.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTradingPair(pair.id, pair.is_active)}
                  >
                    {pair.is_active ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    {pair.is_active ? "Active" : "Inactive"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="minSpread">Minimum Spread (%)</Label>
              <Input
                id="minSpread"
                type="number"
                step="0.01"
                value={settings.min_spread_percentage}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    min_spread_percentage: parseFloat(e.target.value)
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minProfit">Minimum Profit (USDT)</Label>
              <Input
                id="minProfit"
                type="number"
                step="0.1"
                value={settings.min_profit_amount}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    min_profit_amount: parseFloat(e.target.value)
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="refreshInterval"
                  type="number"
                  value={settings.refresh_interval}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      refresh_interval: parseInt(e.target.value)
                    }))
                  }
                />
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    notifications_enabled: checked
                  }))
                }
              />
            </div>
          </div>

          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
