// React Query hook for public batch traceability.
import { useQuery } from "@tanstack/react-query";
import { fetchPublicTrace } from "./api";

export const traceKeys = {
  all: ["traceability"] as const,
  detail: (id: string) => [...traceKeys.all, "detail", id] as const,
};

export const usePublicTrace = (orderId: string) =>
  useQuery({
    queryKey: traceKeys.detail(orderId),
    queryFn: () => fetchPublicTrace(orderId),
    enabled: Boolean(orderId),
    staleTime: 5 * 60 * 1000,
  });
