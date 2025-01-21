import { TestTube2, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const exchangePages = [
  { title: "Bybit", path: "/exchanges/bybit" },
  { title: "Kraken", path: "/exchanges/kraken" },
  { title: "Binance", path: "/exchanges/binance" },
  { title: "Kucoin", path: "/exchanges/kucoin" },
  { title: "OKX", path: "/exchanges/okx" },
];

export function ExchangeMenu() {
  const location = useLocation();
  const currentExchange = exchangePages.find(page => location.pathname === page.path);

  return (
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
  );
}