import { Home, Cloud, Terminal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function NavigationMenu() {
  const location = useLocation();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/" className={location.pathname === "/" ? "text-rokcat-purple" : ""}>
            <Home />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link 
            to="/aws/ec2" 
            className={location.pathname === "/aws/ec2" ? "text-rokcat-purple" : ""}
          >
            <Cloud />
            <span>EC2 Monitor</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link 
            to="/supabase-cli" 
            className={location.pathname === "/supabase-cli" ? "text-rokcat-purple" : ""}
          >
            <Terminal />
            <span>Supabase CLI</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}