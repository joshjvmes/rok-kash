import { Code, Triangle, Database, ChartLine, Brain, Infinity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const algorithmPages = [
  { title: "Pure", path: "/algorithms/pure", icon: Code },
  { title: "Triangle", path: "/algorithms/triangle", icon: Triangle },
  { title: "Pools", path: "/algorithms/pools", icon: Database },
  { title: "Statistical", path: "/algorithms/statistical", icon: ChartLine },
  { title: "Counter", path: "/algorithms/counter", icon: Brain },
  { title: "Semi-Automatic", path: "/algorithms/semi-automatic", icon: Infinity },
];

export function AlgorithmMenu() {
  const location = useLocation();

  return (
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
  );
}