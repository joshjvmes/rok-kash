import { useState, useEffect } from "react";
import { Settings, RefreshCw, Plus, Minus } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const addSymbol = () => {
    setSettings(prev => ({
      ...prev,
      symbols: [...prev.symbols, ""]
    }));
  };

  const removeSymbol = (index: number) => {
    setSettings(prev => ({
      ...prev,
      symbols: prev.symbols.filter((_, i) => i !== index)
    }));
  };

  const updateSymbol = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      symbols: prev.symbols.map((s, i) => i === index ? value : s)
    }));
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
            <Label>Trading Pairs</Label>
            {settings.symbols.map((symbol, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={symbol}
                  onChange={(e) => updateSymbol(index, e.target.value)}
                  placeholder="e.g. BTC/USDT"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeSymbol(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addSymbol}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Trading Pair
            </Button>
          </div>

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
