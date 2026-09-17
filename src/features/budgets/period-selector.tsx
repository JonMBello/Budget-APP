"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatMonth, periodHref, validPeriod } from "@/lib/format";
import { InitializeMonthWizard } from "./initialize-month-wizard";
import { toPeriodKey, type BudgetPeriod } from "./contracts";

export function PeriodSelector({
  periods,
  currentPeriod,
  onPeriodCreated,
}: {
  periods: BudgetPeriod[];
  currentPeriod: BudgetPeriod | null;
  onPeriodCreated?: (period: BudgetPeriod) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const sortedPeriods = [...periods].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  const activePeriodKey =
    validPeriod(searchParams.get("period")) ??
    (currentPeriod ? toPeriodKey(currentPeriod.year, currentPeriod.month) : "");

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "new") {
      setShowWizard(true);
      return;
    }
    const nextHref = periodHref(pathname, value);
    router.push(nextHref);
  }

  return (
    <div className="period-selector-wrap" aria-label="Selector de periodo mensual">
      <select
        className="period-select"
        value={activePeriodKey}
        onChange={handleSelect}
        aria-label="Seleccionar mes activo"
      >
        {sortedPeriods.map((p) => {
          const key = toPeriodKey(p.year, p.month);
          return (
            <option key={key} value={key}>
              {formatMonth(key)} ({p.status === "OPEN" ? "Abierto" : "Cerrado"})
            </option>
          );
        })}
        {periods.length === 0 && currentPeriod && (
          <option value={toPeriodKey(currentPeriod.year, currentPeriod.month)}>
            {formatMonth(toPeriodKey(currentPeriod.year, currentPeriod.month))}
          </option>
        )}
      </select>

      <button
        type="button"
        className="button secondary"
        style={{ minHeight: "44px", padding: "8px 14px", fontSize: "0.875rem" }}
        onClick={() => setShowWizard(true)}
      >
        + Nuevo mes
      </button>

      {showWizard && (
        <InitializeMonthWizard
          lastPeriod={periods[0] ?? currentPeriod}
          onCancel={() => setShowWizard(false)}
          onCreated={(newPeriod) => {
            setShowWizard(false);
            onPeriodCreated?.(newPeriod);
            const key = toPeriodKey(newPeriod.year, newPeriod.month);
            router.push(periodHref(pathname, key));
          }}
        />
      )}
    </div>
  );
}
