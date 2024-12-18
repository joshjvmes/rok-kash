import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ 
  isPaused, 
  setIsPaused, 
  isLoading, 
  onRefresh 
}: DashboardHeaderProps) {
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
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
        Trading Dashboard
      </h1>
      <div className="flex gap-4">
        <Button
          onClick={togglePause}
          variant="outline"
          size="sm"
          className={`gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10 ${
            isPaused ? 'bg-rokcat-purple/10' : ''
          }`}
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4" />
              Resume Updates
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              Pause Updates
            </>
          )}
        </Button>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}