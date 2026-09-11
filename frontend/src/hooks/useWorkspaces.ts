import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWorkspace, listWorkspaces } from "../api/workspaces";
import type { WorkspaceCreate } from "../types/investigation";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
};

export function useWorkspacesList() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: listWorkspaces,
    staleTime: 60_000,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: WorkspaceCreate) => createWorkspace(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}
