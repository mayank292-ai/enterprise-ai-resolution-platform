import { apiClient } from "./client";

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}

export async function getHealth(): Promise<HealthStatus> {
  const response = await apiClient.get<HealthStatus>("/health");
  return response.data;
}
