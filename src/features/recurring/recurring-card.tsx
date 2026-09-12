"use client";

import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";
import { type RecurringTemplate } from "./contracts";

export function RecurringCard({
  template,
  cardName,
  personName,
  linked = true,
}: {
  template: RecurringTemplate;
  cardName?: string;
  personName?: string;
  linked?: boolean;
}) {
  const isMsi = template.category === "MSI";
  const isCancelled = Boolean(template.isCancelled);
  const isPaused = !template.isActive && !isCancelled;

  const statusLabel = isCancelled ? "Cancelado" : isPaused ? "Pausado" : "Activo";
  const statusClass = isCancelled ? "cancelled" : isPaused ? "paused" : "active";

  const categoryLabels: Record<string, { label: string; className: string }> = {
    SERVICE: { label: "Servicio", className: "service" },
    SUBSCRIPTION: { label: "Suscripción", className: "subscription" },
    MSI: { label: "MSI", className: "msi" },
    OTHER_RECURRING: { label: "Recurrente", className: "other_recurring" },
  };

  const catMeta = categoryLabels[template.category] ?? {
    label: template.category,
    className: "service",
  };

  // MSI progress calculation
  const totalInstallments = template.totalInstallments ?? 1;
  const currentInstallment = template.currentInstallment ?? 1;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentInstallment / totalInstallments) * 100)),
  );

  const cardClasses = [
    "recurring-card",
    isCancelled ? "cancelled" : "",
    isPaused ? "paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div>
        <div className="recurring-card-top">
          <div className="recurring-tags">
            <span className={`recurring-category-tag ${catMeta.className}`}>
              {catMeta.label}
            </span>
            {template.split && (
              <span className="split-tag">
                Dividido{" "}
                {template.split.splitType === "PERCENTAGE"
                  ? `${template.split.splitValue}%`
                  : formatMoney(template.split.splitValue, template.currency)}
              </span>
            )}
          </div>
          <span className={`recurring-status-badge ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <h3 className="recurring-title">{template.title}</h3>
        {template.notes && (
          <p className="muted" style={{ fontSize: "0.8125rem", margin: "0 0 8px" }}>
            {template.notes}
          </p>
        )}

        <div className="recurring-amount-row">
          <span className="recurring-amount">
            {formatMoney(template.amount, template.currency)}
          </span>
          <span className="recurring-frequency">/ mes</span>
        </div>

        {isMsi && template.totalInstallments && (
          <div className="msi-progress-box">
            <div className="msi-progress-labels">
              <span>
                Cuota {currentInstallment} de {totalInstallments}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="msi-progress-bar-wrap">
              <div
                className="msi-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {template.totalAmount && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  marginTop: "6px",
                }}
              >
                <span>Total compra:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>
                  {formatMoney(template.totalAmount, template.currency)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="recurring-meta">
        <div className="recurring-meta-item">
          <span>Fecha de inicio:</span>
          <strong style={{ color: "var(--text)" }}>
            {formatDate(template.startDate ?? null)}
          </strong>
        </div>

        {cardName && (
          <div className="recurring-meta-item">
            <span>Método de pago:</span>
            <strong style={{ color: "var(--text)" }}>{cardName}</strong>
          </div>
        )}

        {personName && template.split && (
          <div className="recurring-meta-item">
            <span>Compartido con:</span>
            <strong style={{ color: "var(--text)" }}>{personName}</strong>
          </div>
        )}
      </div>
    </>
  );

  if (!linked) {
    return <div className={cardClasses}>{content}</div>;
  }

  return (
    <Link href={`/recurring/${template.id}`} className={cardClasses}>
      {content}
    </Link>
  );
}
