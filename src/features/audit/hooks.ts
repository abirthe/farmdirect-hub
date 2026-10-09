// React Query hooks for the audit log feature.
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog, verifyAuditChain } from "./api";

export const auditKeys = {
  all: ["audit"] as const,
  list: () => [...auditKeys.all, "list"] as const,
  chain: () => [...auditKeys.all, "chain"] as const,
};

export const useAuditLog = () => useQuery({ queryKey: auditKeys.list(), queryFn: () => fetchAuditLog() });

export const useAuditChain = () =>
  useQuery({ queryKey: auditKeys.chain(), queryFn: verifyAuditChain, staleTime: 60_000 });
