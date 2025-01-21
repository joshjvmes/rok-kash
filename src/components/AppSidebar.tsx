import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavigationMenu } from "./sidebar/NavigationMenu";
import { ExchangeMenu } from "./sidebar/ExchangeMenu";
import { ProtocolMenu } from "./sidebar/ProtocolMenu";
import { AlgorithmMenu } from "./sidebar/AlgorithmMenu";
import { SidebarFooterActions } from "./sidebar/SidebarFooterActions";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavigationMenu />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Exchange Testing</SidebarGroupLabel>
          <SidebarGroupContent>
            <ExchangeMenu />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Protocols</SidebarGroupLabel>
          <SidebarGroupContent>
            <ProtocolMenu />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Algorithms</SidebarGroupLabel>
          <SidebarGroupContent>
            <AlgorithmMenu />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex flex-row items-center gap-2 justify-end">
        <SidebarFooterActions />
      </SidebarFooter>
    </Sidebar>
  );
}