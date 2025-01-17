import { Home, TestTube2, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const exchangePages = [
  { title: "Bybit", path: "/exchanges/bybit" },
  { title: "Kraken", path: "/exchanges/kraken" },
  { title: "Binance", path: "/exchanges/binance" },
  { title: "Kucoin", path: "/exchanges/kucoin" },
  { title: "OKX", path: "/exchanges/okx" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        duration: 2000,
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

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
              {exchangePages.map((page) => (
                <SidebarMenuItem key={page.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={page.path}
                      className={location.pathname === page.path ? "text-rokcat-purple" : ""}
                    >
                      <TestTube2 />
                      <span>{page.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 flex items-center gap-2 justify-end">
        <ThemeSwitcher />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover:bg-rokcat-purple/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}