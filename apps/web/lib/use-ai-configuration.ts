"use client";
import { useQuery } from "@tanstack/react-query";
import { isAiConfiguration } from "./ai-configuration";
export function useAiConfiguration() {
  return useQuery({ queryKey: ["ai-configuration"], retry: false, staleTime: 0,
    queryFn: async () => {
      const response = await fetch("/api/ai/config", { cache: "no-store" });
      const value: unknown = await response.json();
      if (!response.ok || !isAiConfiguration(value)) throw new Error("AI_NOT_CONFIGURED");
      return value;
    } });
}
