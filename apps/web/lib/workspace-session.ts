"use client";
import { useQuery } from "@tanstack/react-query";
import { isSession } from "./profile";

export function useWorkspaceSession() {
  return useQuery({ queryKey: ["private-session"], gcTime: 0, retry: false, refetchOnReconnect: false, queryFn: async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const value: unknown = await response.json();
    if (!response.ok || !isSession(value)) throw new Error("AUTH_REQUIRED");
    return value;
  } });
}
