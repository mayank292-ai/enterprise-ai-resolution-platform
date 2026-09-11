import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveCapabilityGap,
  createInvestigation,
  getInvestigation,
  listInvestigations,
  resumeInvestigation,
  runInvestigation,
} from "../api/investigations";
import type { Investigation, InvestigationRequest } from "../types/investigation";

export const investigationKeys = {
  all: ["investigations"] as const,
  list: () => [...investigationKeys.all, "list"] as const,
  detail: (id: string) => [...investigationKeys.all, "detail", id] as const,
};

const ACTIVE_STATUSES = new Set<Investigation["status"]>([
  "created",
  "planning",
  "investigating",
  "verifying",
]);
const DETAIL_POLL_INTERVAL_MS = 2_000;

export function useInvestigationsList() {
  return useQuery({
    queryKey: investigationKeys.list(),
    queryFn: listInvestigations,
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some(
        (investigation) =>
          ACTIVE_STATUSES.has(investigation.status) ||
          investigation.status === "awaiting_capability_approval",
      ) ?? false;
      return hasActive ? 4_000 : false;
    },
  });
}

export function useCreateInvestigation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: InvestigationRequest) => createInvestigation(request),
    onSuccess: (investigation) => {
      queryClient.setQueryData(
        investigationKeys.detail(investigation.investigation_id),
        investigation,
      );
      void queryClient.invalidateQueries({ queryKey: investigationKeys.list() });
    },
  });
}

/**
 * Reflects the backend-owned investigation lifecycle.
 *
 * `/run` already runs until a pause or terminal state, so it is initiated only
 * for a newly-created record. Approval and resume are serialized as one user
 * command. GET polling observes backend state; it never advances the workflow.
 */
export function useInvestigationSession(investigationId: string | undefined) {
  const queryClient = useQueryClient();
  const commandInFlightRef = useRef(false);
  const startedInvestigationRef = useRef<string | null>(null);

  const cacheInvestigation = (investigation: Investigation) => {
    queryClient.setQueryData(
      investigationKeys.detail(investigation.investigation_id),
      investigation,
    );
  };

  const query = useQuery({
    queryKey: investigationKeys.detail(investigationId ?? ""),
    queryFn: () => getInvestigation(investigationId as string),
    enabled: Boolean(investigationId),
    refetchInterval: (currentQuery) => {
      const status = currentQuery.state.data?.status;
      return status && status !== "completed" && status !== "failed"
        ? DETAIL_POLL_INTERVAL_MS
        : false;
    },
  });

  const run = useMutation({
    mutationFn: () => {
      commandInFlightRef.current = true;
      return runInvestigation(investigationId as string);
    },
    onSuccess: cacheInvestigation,
    onSettled: () => {
      commandInFlightRef.current = false;
      void queryClient.invalidateQueries({ queryKey: investigationKeys.list() });
    },
  });

  const resume = useMutation({
    mutationFn: () => {
      commandInFlightRef.current = true;
      return resumeInvestigation(investigationId as string);
    },
    onSuccess: cacheInvestigation,
    onError: () => {
      // A failed resume may still have advanced backend state.
      void queryClient.invalidateQueries({
        queryKey: investigationKeys.detail(investigationId as string),
      });
    },
    onSettled: () => {
      commandInFlightRef.current = false;
      void queryClient.invalidateQueries({ queryKey: investigationKeys.list() });
    },
  });

  const approve = useMutation({
    mutationFn: async () => {
      commandInFlightRef.current = true;
      await approveCapabilityGap(investigationId as string);

      // The approval endpoint returns only a gap. Re-read the complete record
      // and gate resume on that authoritative persisted investigation state.
      const authoritative = await getInvestigation(investigationId as string);
      cacheInvestigation(authoritative);
      if (
        authoritative.status !== "awaiting_capability_approval" ||
        authoritative.pending_capability_gap?.status !== "ready"
      ) {
        return authoritative;
      }

      return resumeInvestigation(investigationId as string);
    },
    onSuccess: cacheInvestigation,
    onError: () => {
      // Re-read the record so the dialog reflects backend rollback.
      void queryClient.invalidateQueries({
        queryKey: investigationKeys.detail(investigationId as string),
      });
    },
    onSettled: () => {
      commandInFlightRef.current = false;
      void queryClient.invalidateQueries({ queryKey: investigationKeys.list() });
    },
  });

  useEffect(() => {
    if (
      !investigationId ||
      query.data?.status !== "created" ||
      startedInvestigationRef.current === investigationId ||
      commandInFlightRef.current
    ) {
      return;
    }
    startedInvestigationRef.current = investigationId;
    commandInFlightRef.current = true;
    void run.mutateAsync().catch(() => undefined);
    // Mutation identity is deliberately not a lifecycle input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigationId, query.data?.status]);

  return { query, run, approve, resume };
}

export function isActiveStatus(status: Investigation["status"]) {
  return ACTIVE_STATUSES.has(status);
}
