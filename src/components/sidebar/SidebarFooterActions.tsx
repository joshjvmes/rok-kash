import { LogOut, Wallet, TrendingUp, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarFooterActions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        navigate("/login", { replace: true });
        return;
      }

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }

      toast({
        title: "Logged out successfully",
        duration: 2000,
      });
      
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
      
      toast({
        title: "Error during logout",
        description: "You have been redirected to the login page",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-rokcat-purple/10"
          >
            <Link to="/balances">
              <Wallet className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Balances</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-rokcat-purple/10"
          >
            <Link to="/profit-loss">
              <TrendingUp className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Profit/Loss</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-rokcat-purple/10"
          >
            <Link to="/trade-history">
              <History className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Trade History</TooltipContent>
      </Tooltip>

      <ThemeSwitcher />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="hover:bg-rokcat-purple/10"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}