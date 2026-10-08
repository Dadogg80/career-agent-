"use client";
import { useState } from "react";
import type { AiArea } from "./ai-configuration";
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

export function useAiChoice(area: AiArea) {
  const configuration=useAiConfiguration();
  const [token,setToken]=useState<string>();
  const options=configuration.data?.options?.[area] ?? [];
  const defaultApproval=area==="job"?(configuration.data?.job ?? (configuration.data?{token:"",selections:[configuration.data.tasks.JOB_ANALYSIS]}:undefined)):configuration.data?.[area];
  const approval=options.find(o=>o.available && o.approval.token===token)?.approval ?? defaultApproval;
  const alternatives=options.filter(o=>o.available && o.approval.token!==approval?.token);
  return { configuration, approval, options, alternatives, choose:setToken };
}
