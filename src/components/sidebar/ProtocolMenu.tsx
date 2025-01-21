import { ArrowDown, XOctagon, Link2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const protocolPages = [
  { title: "Rebalance", path: "/protocols/rebalance", icon: ArrowDown },
  { title: "Close Positions", path: "/protocols/close-positions", icon: XOctagon },
  { title: "Withdraw", path: "/protocols/withdraw", icon: Link2 },
];

export function ProtocolMenu() {
  const location = useLocation();

  return (
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
  );
}