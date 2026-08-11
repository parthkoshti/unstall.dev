import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2Icon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SwitcherSkeleton } from "@/components/app-sidebar-skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rpcClient, setWorkspaceId } from "@/lib/api";
import { resolveEnvironmentId } from "@/lib/resolve-environment";

export function WorkspaceSwitcher({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const workspacesQuery = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => rpcClient.workspace.list(),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => rpcClient.workspace.create({ name }),
    onSuccess: async (data) => {
      setCreateOpen(false);
      setNewName("");
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setWorkspaceId(data.workspaceId);
      const envs = await rpcClient.environment.list({
        workspaceId: data.workspaceId,
      });
      const environmentId = resolveEnvironmentId(data.workspaceId, envs);
      if (environmentId) {
        navigate({
          to: "/$workspaceId/$environmentId",
          params: {
            workspaceId: data.workspaceId,
            environmentId,
          },
        });
      }
    },
  });

  const workspaces = workspacesQuery.data ?? [];
  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);

  if (workspacesQuery.isPending) {
    return <SwitcherSkeleton />;
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={activeWorkspace.name}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-5 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2Icon className="size-3" />
                </div>
                <span className="truncate font-medium">{activeWorkspace.name}</span>
                <ChevronsUpDownIcon className="ml-auto size-3.5 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  className="gap-2 p-2"
                  onClick={async () => {
                    if (workspace.id === workspaceId) return;
                    setWorkspaceId(workspace.id);
                    const envs = await rpcClient.environment.list({
                      workspaceId: workspace.id,
                    });
                    const environmentId = resolveEnvironmentId(
                      workspace.id,
                      envs,
                    );
                    if (!environmentId) return;
                    navigate({
                      to: "/$workspaceId/$environmentId",
                      params: {
                        workspaceId: workspace.id,
                        environmentId,
                      },
                    });
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2Icon className="size-3.5 shrink-0" />
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setCreateOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                  <PlusIcon className="size-3.5 shrink-0" />
                </div>
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your queues and team.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                createMutation.mutate(newName.trim());
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newName.trim())}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
