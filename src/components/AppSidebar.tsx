import { Home, TestTube2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "react-router-dom";

const exchangePages = [
  { title: "Bybit", path: "/exchanges/bybit" },
  { title: "Coinbase", path: "/exchanges/coinbase" },
  { title: "Kraken", path: "/exchanges/kraken" },
  { title: "Binance", path: "/exchanges/binance" },
  { title: "Kucoin", path: "/exchanges/kucoin" },
  { title: "OKX", path: "/exchanges/okx" },
];

export function AppSidebar() {
  const location = useLocation();

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
    </Sidebar>
  );
}