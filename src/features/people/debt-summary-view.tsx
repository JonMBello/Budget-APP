"use client";

import { useEffect, useState } from "react";
import { ErrorState, Money } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { type DebtSummary } from "./contracts";

export function DebtSummaryView({ personId }: { personId: string }) {
  const [debts, setDebts] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    let ignore = false;
    clientRequest<DebtSummary>(`/people/${personId}/debts`)
      .then((data) => {
        if (!ignore) {
          setDebts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "No pudimos consultar las deudas de esta persona.",
          );
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [personId]);

  async function refetchDebts() {
    setLoading(true);
    setError("");
    try {
      const data = await clientRequest<DebtSummary>(`/people/${personId}/debts`);
      setDebts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos consultar las deudas de esta persona.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSettle(expenseId: string) {
    setSettlingId(expenseId);
    setActionSuccess("");
    setError("");
    try {
      await clientRequest(`/people/${personId}/settle`, {
        method: "POST",
        body: { expenseId },
      });
      setActionSuccess("Cobro registrado exitosamente.");
      await refetchDebts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos registrar el cobro.",
      );
    } finally {
      setSettlingId(null);
    }
  }

  if (loading && !debts) {
    return (
      <section className="debt-widget" aria-labelledby="debts-title">
        <h2 id="debts-title" style={{ fontSize: "1.25rem" }}>
          Cuentas por cobrar
        </h2>
        <p className="muted" style={{ fontSize: "0.875rem" }}>
          Consultando saldos y compromisos…
        </p>
      </section>
    );
  }

  const msiInstallments = debts?.msiInstallments ?? [];
  const recurringServices = debts?.recurringServices ?? [];
  const singleExpenses = debts?.singleExpenses ?? [];
  const totalDebt = debts?.totalDebt ?? 0;
  const immediateDueAmount = debts?.immediateDueAmount ?? 0;

  const hasDebts =
    debts &&
    (totalDebt > 0 ||
      msiInstallments.length > 0 ||
      recurringServices.length > 0 ||
      singleExpenses.length > 0);

  return (
    <section className="debt-widget" aria-labelledby="debts-title">
      <p className="eyebrow" style={{ marginBottom: "6px" }}>
        BALANCE FINANCIERO
      </p>
      <h2 id="debts-title" style={{ fontSize: "1.375rem" }}>
        Cuentas por cobrar
      </h2>

      {error && (
        <div style={{ marginTop: "16px" }}>
          <ErrorState message={error} retry={refetchDebts} />
        </div>
      )}

      {actionSuccess && (
        <p className="success-message" role="status" style={{ marginTop: "12px" }}>
          {actionSuccess}
        </p>
      )}

      {debts && (
        <div className="simulator-grid" style={{ marginTop: "20px" }}>
          <div className="simulator-metric">
            <p className="label">Total adeudado</p>
            <p className="val green">
              <Money amount={totalDebt} />
            </p>
          </div>

          <div className="simulator-metric">
            <p className="label">Cobro inmediato</p>
            <p className="val blue">
              <Money amount={immediateDueAmount} />
            </p>
          </div>

          <div className="simulator-metric">
            <p className="label">Próximo vencimiento</p>
            <p className="val" style={{ fontSize: "1.125rem" }}>
              {formatDate(debts.nextPaymentDueDate ?? null)}
            </p>
          </div>
        </div>
      )}

      {!hasDebts && !loading && (
        <div style={{ marginTop: "24px", color: "var(--muted)", fontSize: "0.9375rem" }}>
          Esta persona no tiene deudas ni cobros pendientes registrados.
        </div>
      )}

      {debts && msiInstallments.length > 0 && (
        <div className="debt-subsections">
          <h3 style={{ fontSize: "1.0625rem", color: "var(--text)", marginBottom: "12px" }}>
            Compras a Meses Sin Intereses (MSI)
          </h3>
          <div className="debt-items-list" role="list">
            {msiInstallments.map((item, idx) => (
              <div key={idx} className="debt-item-card" role="listitem">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                  <p className="muted" style={{ fontSize: "0.8125rem", margin: "4px 0 0" }}>
                    {item.currentInstallment && item.totalInstallments
                      ? `Cuota ${item.currentInstallment} de ${item.totalInstallments}`
                      : "Cuota activa"}{" "}
                    {item.cardName ? `· ${item.cardName}` : ""} · Vence:{" "}
                    {formatDate(item.paymentDueDate ?? null)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="money" style={{ margin: 0, fontWeight: 700, color: "var(--blue)" }}>
                    <Money amount={item.amount} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts && recurringServices.length > 0 && (
        <div className="debt-subsections">
          <h3 style={{ fontSize: "1.0625rem", color: "var(--text)", marginBottom: "12px" }}>
            Servicios y suscripciones compartidas
          </h3>
          <div className="debt-items-list" role="list">
            {recurringServices.map((item, idx) => (
              <div key={idx} className="debt-item-card" role="listitem">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                  <p className="muted" style={{ fontSize: "0.8125rem", margin: "4px 0 0" }}>
                    Vence: {formatDate(item.paymentDueDate ?? null)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="money" style={{ margin: 0, fontWeight: 700, color: "var(--blue)" }}>
                    <Money amount={item.amount} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts && singleExpenses.length > 0 && (
        <div className="debt-subsections">
          <h3 style={{ fontSize: "1.0625rem", color: "var(--text)", marginBottom: "12px" }}>
            Gastos y compras puntuales
          </h3>
          <div className="debt-items-list" role="list">
            {debts.singleExpenses.map((item) => (
              <div
                key={item.expenseId}
                className={`debt-item-card ${item.settled ? "settled" : ""}`}
                role="listitem"
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                  <p className="muted" style={{ fontSize: "0.8125rem", margin: "4px 0 0" }}>
                    Vence: {formatDate(item.paymentDueDate ?? null)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <p className="money" style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>
                    <Money amount={item.amount} />
                  </p>
                  {!item.settled && (
                    <button
                      className="button secondary"
                      style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem" }}
                      disabled={settlingId === item.expenseId}
                      onClick={() => handleSettle(item.expenseId)}
                    >
                      {settlingId === item.expenseId ? "Cobrando…" : "Marcar cobrado"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
