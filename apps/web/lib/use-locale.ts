"use client";
import { useEffect, useState } from "react";
import type { Locale } from "./translations";
export function useLocale() {
  const [locale, setLocale] = useState<Locale>("nb");
  useEffect(() => { try { const saved = localStorage.getItem("career-agent.locale"); if (saved === "nb" || saved === "en") setLocale(saved); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  function changeLocale(value: Locale) { setLocale(value); try { localStorage.setItem("career-agent.locale", value); } catch {} }
  return { locale, changeLocale };
}
