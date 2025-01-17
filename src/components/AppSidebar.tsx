import { Home, TestTube2, LogOut, Database, Link2, ArrowDown, XOctagon, Brain, Triangle, Code, ChartLine, Infinity, ChevronDown, Wallet, TrendingUp, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const exchangePages = [
  { title: "Bybit", path: "/exchanges/bybit" },
  { title: "Kraken", path: "/exchanges/kraken" },
  { title: "Binance", path: "/exchanges/binance" },
  { title: "Kucoin", path: "/exchanges/kucoin" },
  { title: "OKX", path: "/exchanges/okx" },
];

const protocolPages = [
  { title: "Rebalance", path: "/protocols/rebalance", icon: ArrowDown },
  { title: "Close Positions", path: "/protocols/close-positions", icon: XOctagon },
  { title: "Withdraw", path: "/protocols/withdraw", icon: Link2 },
];

const algorithmPages = [
  { title: "Pure", path: "/algorithms/pure", icon: Code },
  { title: "Triangle", path: "/algorithms/triangle", icon: Triangle },
  { title: "Pools", path: "/algorithms/pools", icon: Database },
  { title: "Statistical", path: "/algorithms/statistical", icon: ChartLine },
  { title: "Counter", path: "/algorithms/counter", icon: Brain },
  { title: "Semi-Automatic", path: "/algorithms/semi-automatic", icon: Infinity },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        duration: 2000,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const currentExchange = exchangePages.find(page => location.pathname === page.path);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className={location.pathname === "/" ? "text-rokcat-purple" : ""}>
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Exchange Testing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <TestTube2 className="h-4 w-4" />
                      <span>{currentExchange?.title || "Select Exchange"}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-56" 
                    align="start" 
                    sideOffset={8}
                  >
                    {exchangePages.map((page) => (
                      <DropdownMenuItem key={page.path} asChild>
                        <Link
                          to={page.path}
                          className={location.pathname === page.path ? "text-rokcat-purple" : ""}
                        >
                          {page.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Protocols</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {protocolPages.map((page) => (
                <SidebarMenuItem key={page.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={page.path}
                      className={location.pathname === page.path ? "text-rokcat-purple" : ""}
                    >
                      <page.icon />
                      <span>{page.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Algorithms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {algorithmPages.map((page) => (
                <SidebarMenuItem key={page.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={page.path}
                      className={location.pathname === page.path ? "text-rokcat-purple" : ""}
                    >
                      <page.icon />
                      <span>{page.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-row items-center gap-2 justify-end">
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
      </SidebarFooter>
    </Sidebar>
  );
}
