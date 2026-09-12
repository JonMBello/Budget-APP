"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMonth, periodHref } from "@/lib/format";
import { toPeriodKey, type BudgetPeriod } from "@/features/budgets/contracts";
import { useRef, useState } from "react";
import { ConfirmDialog, EmptyState, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import { RecurringCard } from "./recurring-card";
import { RecurringForm } from "./recurring-form";
import { instantiateRecurringResultSchema, type RecurringTemplate } from "./contracts";

type FilterTab = "ALL" | "SERVICE" | "SUBSCRIPTION" | "MSI" | "INACTIVE";

export function RecurringList({
  period = null,
  initialTemplates,
  cards = [],
  people = [],
}: {
  period?: BudgetPeriod | null;
  initialTemplates: RecurringTemplate[];
  cards?: Card[];
  people?: Person[];
}) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [templates, setTemplates] = useState<RecurringTemplate[]>(initialTemplates);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [adding, setAdding] = useState(false);

  // Instantiation state
  const [instantiateDialogOpen, setInstantiateDialogOpen] = useState(false);
  const [pendingInstantiate, setPendingInstantiate] = useState(false);
  const [instantiateMessage, setInstantiateMessage] = useState<string | null>(null);
  const [instantiateError, setInstantiateError] = useState("");

  const periodKey = period ? toPeriodKey(period.year, period.month) : null;
  const periodLabel = periodKey ? formatMonth(periodKey) : "";
  const canInstantiate = period?.status === "OPEN";

  // Filter calculation
  const displayedTemplates = templates.filter((t) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "INACTIVE") return !t.isActive || t.isCancelled;
    if (activeTab === "SERVICE") return t.category === "SERVICE" && t.isActive && !t.isCancelled;
    if (activeTab === "SUBSCRIPTION") return t.category === "SUBSCRIPTION" && t.isActive && !t.isCancelled;
    if (activeTab === "MSI") return t.category === "MSI" && t.isActive && !t.isCancelled;
    return true;
  });

  const allCount = templates.length;
  const serviceCount = templates.filter(
    (t) => t.category === "SERVICE" && t.isActive && !t.isCancelled,
  ).length;
  const subCount = templates.filter(
    (t) => t.category === "SUBSCRIPTION" && t.isActive && !t.isCancelled,
  ).length;
  const msiCount = templates.filter(
    (t) => t.category === "MSI" && t.isActive && !t.isCancelled,
  ).length;
  const inactiveCount = templates.filter((t) => !t.isActive || t.isCancelled).length;

  async function handleInstantiate() {
    if (!period || !canInstantiate || inFlight.current) return;
    inFlight.current = true;
    setPendingInstantiate(true);
    setInstantiateError("");
    setInstantiateMessage(null);

    try {
      const raw = await clientRequest<unknown>("/recurring/instantiate", {
        method: "POST",
        body: { periodId: period.id },
      });
      const parsed = instantiateRecurringResultSchema.safeParse(raw);
      if (!parsed.success || parsed.data.periodId !== period.id ||
          parsed.data.year !== period.year || parsed.data.month !== period.month) {
        throw new Error("No pudimos confirmar el resultado. Revisa los gastos del periodo antes de reintentar.");
      }
      const { createdCount, skippedCount } = parsed.data;
      setInstantiateMessage(createdCount > 0
        ? `Se agregaron ${createdCount} gastos a ${periodLabel}; ${skippedCount} ya estaban registrados.`
        : skippedCount > 0
          ? `No se agregaron gastos nuevos a ${periodLabel}; ${skippedCount} ya estaban registrados.`
          : `No hay compromisos elegibles para agregar a ${periodLabel}.`);
      router.refresh();
      setInstantiateDialogOpen(false);

      // Re-fetch or update templates to reflect incremented MSI installments
      try {
        const refreshed = await clientRequest<RecurringTemplate[]>(
          "/recurring?includeInactive=true",
        );
        setTemplates(refreshed);
      } catch {
        // keep current templates if refresh fails
      }
    } catch (err) {
      setInstantiateError(
        err instanceof Error
          ? err.message
          : "No pudimos instanciar los compromisos en el periodo.",
      );
    } finally {
      inFlight.current = false;
      setPendingInstantiate(false);
    }
  }

  return (
    <div>
      <p className="muted">{period
        ? `Periodo destino: ${periodLabel} (${period.status === "OPEN" ? "abierto" : "cerrado"}).`
        : "Selecciona o crea un periodo para agregar los compromisos."}</p>
      {period?.status === "CLOSED" && <p className="muted">El periodo está cerrado. Selecciona uno abierto para agregar gastos.</p>}
      <div className="actions-bar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filtrar compromisos por tipo"
          style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: "4px" }}
        >
          <button
            type="button"
            className="filter-tab"
            aria-pressed={activeTab === "ALL"}
            onClick={() => setActiveTab("ALL")}
          >
            Todas ({allCount})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={activeTab === "SERVICE"}
            onClick={() => setActiveTab("SERVICE")}
          >
            Servicios ({serviceCount})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={activeTab === "SUBSCRIPTION"}
            onClick={() => setActiveTab("SUBSCRIPTION")}
          >
            Suscripciones ({subCount})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={activeTab === "MSI"}
            onClick={() => setActiveTab("MSI")}
          >
            MSI ({msiCount})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={activeTab === "INACTIVE"}
            onClick={() => setActiveTab("INACTIVE")}
          >
            Inactivas ({inactiveCount})
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => setInstantiateDialogOpen(true)}
            disabled={!canInstantiate || pendingInstantiate}
          >
            {pendingInstantiate ? "Agregando…" : "Agregar al periodo"}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Cerrar" : "+ Nuevo compromiso"}
          </button>
        </div>
      </div>

      {instantiateMessage && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 18px",
            background: "#14362e",
            border: "1px solid #1f5749",
            borderRadius: "10px",
            color: "var(--green)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span role="status">✓ {instantiateMessage}</span>
          <Link href={periodHref("/expenses", periodKey)} prefetch={false}>Ver gastos del periodo</Link>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--text)",
              cursor: "pointer",
            }}
            onClick={() => setInstantiateMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {instantiateError && (
        <div style={{ marginTop: "16px" }}>
          <ErrorState message={instantiateError} />
        </div>
      )}

      {adding && (
        <div style={{ margin: "24px 0", maxWidth: "560px" }}>
          <RecurringForm
            cards={cards}
            people={people}
            onSuccess={(newTemplate) => {
              setTemplates([newTemplate, ...templates]);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {displayedTemplates.length === 0 ? (
        <EmptyState
          title={
            activeTab === "ALL"
              ? "No tienes compromisos registrados"
              : "No hay compromisos con este filtro"
          }
          action={
            !adding && (
              <button
                className="button secondary"
                onClick={() => setAdding(true)}
                style={{ marginTop: "16px" }}
              >
                Crear tu primer compromiso o suscripción
              </button>
            )
          }
        >
          Registra tus servicios fijos (luz, agua, internet), suscripciones recurrentes y
          compras a Meses Sin Intereses para generarlos automáticamente cada mes.
        </EmptyState>
      ) : (
        <div className="recurring-grid" role="list">
          {displayedTemplates.map((template) => {
            const cardName = cards.find((c) => c.id === template.cardId)?.name;
            const personName = people.find(
              (p) => p.id === template.split?.personId,
            )?.name;
            return (
              <RecurringCard
                key={template.id}
                template={template}
                cardName={cardName}
                personName={personName}
              />
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={instantiateDialogOpen}
        title="¿Agregar compromisos al periodo?"
        pending={pendingInstantiate}
        onCancel={() => setInstantiateDialogOpen(false)}
        onConfirm={handleInstantiate}
      >
        <p style={{ color: "var(--text)", margin: "0 0 12px" }}>
          Esta acción creará los gastos y cobros del periodo seleccionado (
          <strong>
            {periodLabel}
          </strong>
          ) a partir de tus plantillas activas y vigentes.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
          La operación es idempotente: no duplicará cargos para compromisos que ya
          hayan sido instanciados previamente en este periodo.
        </p>
      </ConfirmDialog>
    </div>
  );
}
