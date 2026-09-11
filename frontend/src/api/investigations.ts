import { apiClient } from "./client";
import { investigationSchema } from "./schemas";

import type {
  CapabilityGap,
  Investigation,
  InvestigationRequest,
} from "../types/investigation";

const BASE = "/api/v1/investigations";

/**
 * Parse the backend response while preserving any additional
 * backend fields that are not explicitly used by the frontend.
 */
function parse(data: unknown): Investigation {
  return investigationSchema.parse(
    data,
  ) as unknown as Investigation;
}

export async function createInvestigation(
  request: InvestigationRequest,
): Promise<Investigation> {
  const response = await apiClient.post(
    BASE,
    request,
  );

  return parse(response.data);
}

export async function listInvestigations(): Promise<
  Investigation[]
> {
  const response = await apiClient.get(BASE);

  return (response.data as unknown[]).map(parse);
}

export async function getDemoInvestigation(): Promise<Investigation> {
  const response = await apiClient.get(
    `${BASE}/demo`,
  );

  return parse(response.data);
}

export async function getInvestigation(
  investigationId: string,
): Promise<Investigation> {
  const response = await apiClient.get(
    `${BASE}/${investigationId}`,
  );

  return parse(response.data);
}

/**
 * Advances the supervisor by one backend step.
 */
export async function runInvestigation(
  investigationId: string,
): Promise<Investigation> {
  const response = await apiClient.post(
    `${BASE}/${investigationId}/run`,
    undefined,
    {
      // Supervisor and specialist execution is synchronous and commonly
      // exceeds the shared request timeout. The backend response is the
      // lifecycle result, so the frontend must keep this command attached.
      timeout: 0,
    },
  );

  return parse(response.data);
}

/**
 * Approves a pending capability proposal.
 *
 * NOTE:
 * The backend intentionally returns the CapabilityGap rather than
 * the full Investigation object. The caller should refetch the
 * investigation afterwards.
 */
export async function approveCapabilityGap(
  investigationId: string,
): Promise<CapabilityGap> {
  const response = await apiClient.post(
    `${BASE}/${investigationId}/capability-gap/approve`,
  );

  return response.data as CapabilityGap;
}

/**
 * Resumes an investigation after capability provisioning.
 */
export async function resumeInvestigation(
  investigationId: string,
): Promise<Investigation> {
  const response = await apiClient.post(
    `${BASE}/${investigationId}/resume`,
    undefined,
    {
      // The backend currently performs the resumed investigation
      // synchronously, so the request can legitimately take longer
      // than the shared 15-second client timeout.
      timeout: 0,
    },
  );

  return parse(response.data);
}
