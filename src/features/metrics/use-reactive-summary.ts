"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  budgetSummarySchema,
  type BudgetSummary,
} from "@/features/budgets/contracts";

const SYNC_CHANNEL_NAME = "budget-app-sync-channel";
const SYNC_STORAGE_KEY = "budget-app:mutation-sync";

export function useReactiveSummary({
  year,
  month,
  initialSummary,
}: {
  year: number;
  month: number;
  initialSummary: BudgetSummary;
}) {
  const [periodKey, setPeriodKey] = useState(`${year}-${month}`);
  const [summary, setSummary] = useState<BudgetSummary>(initialSummary);
  const [isUpdating, setIsUpdating] = useState(false);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);

  if (periodKey !== `${year}-${month}`) {
    setPeriodKey(`${year}-${month}`);
    setSummary(initialSummary);
    setStaleNotice(null);
  }

  const activePeriodRef = useRef({ year, month });
  useEffect(() => {
    activePeriodRef.current = { year, month };
  }, [year, month]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(
    async (silent = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const targetYear = activePeriodRef.current.year;
      const targetMonth = activePeriodRef.current.month;

      if (!silent) {
        setIsUpdating(true);
      }

      try {
        const response = await fetch(
          `/app/bff/budgets/${targetYear}/${targetMonth}/summary`,
          {
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache" },
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            setStaleNotice("Sesión vencida. Inicia sesión nuevamente.");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const parsed = budgetSummarySchema.parse(data);

        // Guard: only apply if the period is still the active one
        if (
          activePeriodRef.current.year === targetYear &&
          activePeriodRef.current.month === targetMonth
        ) {
          setSummary(parsed);
          setStaleNotice(null);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        // Retain last known data and show subtle notice
        setStaleNotice("No se pudo actualizar el balance. Mostrando datos anteriores.");
      } finally {
        if (
          activePeriodRef.current.year === targetYear &&
          activePeriodRef.current.month === targetMonth
        ) {
          setIsUpdating(false);
        }
      }
    },
    [],
  );

  // Revalidate when period changes
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/app/bff/budgets/${year}/${month}/summary`,
          {
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache" },
          },
        );
        if (!response.ok) {
          if (response.status === 401) {
            if (active) setStaleNotice("Sesión vencida. Inicia sesión nuevamente.");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const parsed = budgetSummarySchema.parse(data);
        if (active) {
          setSummary(parsed);
          setStaleNotice(null);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (active) {
          setStaleNotice("No se pudo actualizar el balance. Mostrando datos anteriores.");
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [year, month]);

  // Window focus & online revalidation
  useEffect(() => {
    function handleFocus() {
      fetchSummary(false);
    }
    function handleOnline() {
      fetchSummary(false);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchSummary]);

  // Cross-tab synchronization (no financial data in message)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === "BUDGET_MUTATED") {
            fetchSummary(false);
          }
        };
      } catch {
        channel = null;
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === SYNC_STORAGE_KEY) {
        fetchSummary(false);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [fetchSummary]);

  // Notify mutation across local and other tabs
  const notifyMutation = useCallback(() => {
    // Local revalidation
    fetchSummary(false);

    // Cross-tab notification (metadata only, zero financial figures)
    const timestamp = Date.now().toString();
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({ type: "BUDGET_MUTATED", timestamp });
        channel.close();
      }
    } catch {
      // Fallback
    }

    try {
      localStorage.setItem(SYNC_STORAGE_KEY, timestamp);
    } catch {
      // Storage unavailable
    }
  }, [fetchSummary]);

  return {
    summary,
    isUpdating,
    staleNotice,
    revalidate: fetchSummary,
    notifyMutation,
  };
}
