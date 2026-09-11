import { apiClient } from "./client";
import { workspaceSchema } from "./schemas";
import type { Workspace, WorkspaceCreate } from "../types/investigation";

const BASE = "/api/v1/workspaces";

function parse(data: unknown): Workspace {
  return workspaceSchema.parse(data) as unknown as Workspace;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await apiClient.get(BASE);
  return (response.data as unknown[]).map(parse);
}

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const response = await apiClient.get(`${BASE}/${workspaceId}`);
  return parse(response.data);
}

export async function createWorkspace(request: WorkspaceCreate): Promise<Workspace> {
  const response = await apiClient.post(BASE, request);
  return parse(response.data);
}
