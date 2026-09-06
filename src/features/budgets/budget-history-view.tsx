"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState, Money } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { formatMonth } from "@/lib/format";
import { PeriodStatusBadge } from "./period-status-badge";
import {
  toPeriodKey,
  type BudgetPeriod,
  type BudgetSummary,
} from "./contracts";

export function BudgetHistoryView({
  initialPeriods,
}: {
  initialPeriods: BudgetPeriod[];
}) {
  const [periods] = useState<BudgetPeriod[]>(initialPeriods);

  // Comparator states
  const [periodAKey, setPeriodAKey] = useState<string>(
    initialPeriods[0] ? toPeriodKey(initialPeriods[0].year, initialPeriods[0].month) : "",
  );
  const [periodBKey, setPeriodBKey] = useState<string>(
    initialPeriods[1]
      ? toPeriodKey(initialPeriods[1].year, initialPeriods[1].month)
      : initialPeriods[0]
        ? toPeriodKey(initialPeriods[0].year, initialPeriods[0].month)
        : "",
  );

  const [summaryA, setSummaryA] = useState<BudgetSummary | null>(null);
  const [summaryB, setSummaryB] = useState<BudgetSummary | null>(null);
  const [loadingA, setLoadingA] = useState(Boolean(initialPeriods[0]));
  const [loadingB, setLoadingB] = useState(
    Boolean(initialPeriods[1] || initialPeriods[0]),
  );
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");

  useEffect(() => {
    if (!periodAKey) return;
    const [y, m] = periodAKey.split("-").map(Number);
    let ignore = false;

    clientRequest<BudgetSummary>(`/budgets/${y}/${m}/summary`)
      .then((data) => {
        if (!ignore) {
          setSummaryA(data);
          setLoadingA(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorA(
            err instanceof Error
              ? err.message
              : `Error al consultar el resumen de ${formatMonth(periodAKey)}`,
          );
          setSummaryA(null);
          setLoadingA(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [periodAKey]);

  useEffect(() => {
    if (!periodBKey) return;
    const [y, m] = periodBKey.split("-").map(Number);
    let ignore = false;

    clientRequest<BudgetSummary>(`/budgets/${y}/${m}/summary`)
      .then((data) => {
        if (!ignore) {
          setSummaryB(data);
          setLoadingB(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorB(
            err instanceof Error
              ? err.message
              : `Error al consultar el resumen de ${formatMonth(periodBKey)}`,
          );
          setSummaryB(null);
          setLoadingB(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [periodBKey]);

  const maxIncome = Math.max(
    summaryA?.totalIncome || 0,
    summaryB?.totalIncome || 0,
    1,
  );
  const maxExpenses = Math.max(
    summaryA?.totalExpenses || 0,
    summaryB?.totalExpenses || 0,
    1,
  );

  return (
    <div style={{ marginTop: "24px" }}>
      <section aria-labelledby="history-list-title">
        <h2 id="history-list-title" style={{ fontSize: "1.375rem" }}>
          Todos los periodos registrados
        </h2>

        {periods.length === 0 ? (
          <p className="muted" style={{ marginTop: "16px" }}>
            Aún no has inicializado ningún periodo presupuestario.
          </p>
        ) : (
          <div className="history-grid" role="list">
            {periods.map((p) => {
              const key = toPeriodKey(p.year, p.month);
              const net = p.totalIncome - p.totalExpenses;
              return (
                <Link
                  key={key}
                  href={`/?period=${key}`}
                  className="history-card"
                  role="listitem"
                  aria-label={`Presupuesto de ${formatMonth(key)}`}
                >
                  <div className="history-card-top">
                    <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
                      {formatMonth(key)}
                    </h3>
                    <PeriodStatusBadge status={p.status} />
                  </div>

                  <div className="history-card-metrics">
                    <div className="history-metric">
                      <p className="label">Ingresos</p>
                      <p className="val green">
                        <Money amount={p.totalIncome} />
                      </p>
                    </div>
                    <div className="history-metric">
                      <p className="label">Gastos</p>
                      <p className="val">
                        <Money amount={p.totalExpenses} />
                      </p>
                    </div>
                    <div className="history-metric">
                      <p className="label">Balance neto</p>
                      <p className={`val ${net < 0 ? "negative" : "blue"}`}>
                        <Money amount={net} />
                      </p>
                    </div>
                    <div className="history-metric">
                      <p className="label">Ahorro acarreado</p>
                      <p
                        className={`val ${p.carriedSavings < 0 ? "negative" : "green"}`}
                      >
                        <Money amount={p.carriedSavings} />
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.875rem",
                      color: "var(--blue)",
                      fontWeight: 600,
                    }}
                  >
                    <span>Abrir este mes →</span>
                    {p.notes && (
                      <span
                        className="muted"
                        style={{
                          fontSize: "0.8125rem",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.notes}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {periods.length >= 2 && (
        <section className="comparator-box" aria-labelledby="comparator-title">
          <p className="eyebrow" style={{ marginBottom: "8px" }}>
            ANÁLISIS COMPARATIVO
          </p>
          <h2 id="comparator-title" style={{ fontSize: "1.5rem" }}>
            Comparar dos meses
          </h2>
          <p className="muted" style={{ fontSize: "0.9375rem" }}>
            Analiza el comportamiento de tus ingresos, gastos y ahorro entre dos
            periodos reales a partir de sus resúmenes calculados.
          </p>

          <div className="comparator-controls">
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="select-period-a">Primer mes:</label>
              <select
                id="select-period-a"
                value={periodAKey}
                onChange={(e) => {
                  setPeriodAKey(e.target.value);
                  setLoadingA(true);
                  setErrorA("");
                }}
                style={{ minHeight: "42px" }}
              >
                {periods.map((p) => {
                  const key = toPeriodKey(p.year, p.month);
                  return (
                    <option key={key} value={key}>
                      {formatMonth(key)}
                    </option>
                  );
                })}
              </select>
            </div>

            <span style={{ fontWeight: 700, color: "var(--muted)", marginTop: "24px" }}>
              frente a
            </span>

            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="select-period-b">Segundo mes:</label>
              <select
                id="select-period-b"
                value={periodBKey}
                onChange={(e) => {
                  setPeriodBKey(e.target.value);
                  setLoadingB(true);
                  setErrorB("");
                }}
                style={{ minHeight: "42px" }}
              >
                {periods.map((p) => {
                  const key = toPeriodKey(p.year, p.month);
                  return (
                    <option key={key} value={key}>
                      {formatMonth(key)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="comparator-grid">
            {/* Column A */}
            <div className="comparison-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
                {formatMonth(periodAKey)}
              </h3>
              {loadingA && <p className="muted">Cargando métricas…</p>}
              {errorA && <ErrorState message={errorA} />}
              {summaryA && !loadingA && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Ingresos totales
                      </span>
                      <strong className="green">
                        <Money amount={summaryA.totalIncome} />
                      </strong>
                    </div>
                    <div className="comparison-bar-wrap">
                      <div
                        className="comparison-bar green"
                        style={{
                          width: `${Math.min(100, Math.round((summaryA.totalIncome / maxIncome) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Gastos totales
                      </span>
                      <strong>
                        <Money amount={summaryA.totalExpenses} />
                      </strong>
                    </div>
                    <div className="comparison-bar-wrap">
                      <div
                        className="comparison-bar red"
                        style={{
                          width: `${Math.min(100, Math.round((summaryA.totalExpenses / maxExpenses) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Balance neto
                      </span>
                      <strong className={summaryA.netBalance < 0 ? "negative" : "blue"}>
                        <Money amount={summaryA.netBalance} />
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Ahorro proyectado
                      </span>
                      <strong className="green">
                        <Money amount={summaryA.projectedSavings} />
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column B */}
            <div className="comparison-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
                {formatMonth(periodBKey)}
              </h3>
              {loadingB && <p className="muted">Cargando métricas…</p>}
              {errorB && <ErrorState message={errorB} />}
              {summaryB && !loadingB && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Ingresos totales
                      </span>
                      <strong className="green">
                        <Money amount={summaryB.totalIncome} />
                      </strong>
                    </div>
                    <div className="comparison-bar-wrap">
                      <div
                        className="comparison-bar green"
                        style={{
                          width: `${Math.min(100, Math.round((summaryB.totalIncome / maxIncome) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Gastos totales
                      </span>
                      <strong>
                        <Money amount={summaryB.totalExpenses} />
                      </strong>
                    </div>
                    <div className="comparison-bar-wrap">
                      <div
                        className="comparison-bar red"
                        style={{
                          width: `${Math.min(100, Math.round((summaryB.totalExpenses / maxExpenses) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Balance neto
                      </span>
                      <strong className={summaryB.netBalance < 0 ? "negative" : "blue"}>
                        <Money amount={summaryB.netBalance} />
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        Ahorro proyectado
                      </span>
                      <strong className="green">
                        <Money amount={summaryB.projectedSavings} />
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
