import { Link, useMatchRoute } from "@tanstack/react-router";
import { ServerIcon, Settings2Icon, UsersIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const workspaceItems = [
  {
    title: "Settings",
    to: "/$workspaceId/settings" as const,
    icon: Settings2Icon,
  },
  {
    title: "Environments",
    to: "/$workspaceId/settings/environments" as const,
    icon: ServerIcon,
  },
  {
    title: "Members",
    to: "/$workspaceId/settings/members" as const,
    icon: UsersIcon,
  },
] as const;

export function NavSettings({ workspaceId }: { workspaceId: string }) {
  const matchRoute = useMatchRoute();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {workspaceItems.map((item) => {
          const Icon = item.icon;
          const isActive = !!matchRoute({
            to: item.to,
            params: { workspaceId },
          });

          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link to={item.to} params={{ workspaceId }}>
                  <Icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
