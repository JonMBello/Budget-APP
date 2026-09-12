"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import { RecurringCard } from "./recurring-card";
import { RecurringForm } from "./recurring-form";
import { MsiAdvanceModal } from "./msi-advance-modal";
import { type RecurringTemplate } from "./contracts";

export function RecurringDetail({
  initialTemplate,
  cards = [],
  people = [],
}: {
  initialTemplate: RecurringTemplate;
  cards?: Card[];
  people?: Person[];
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<RecurringTemplate>(initialTemplate);
  const [editing, setEditing] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);

  // Dialogs state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const [pendingToggleActive, setPendingToggleActive] = useState(false);
  const [actionError, setActionError] = useState("");

  const isMsi = template.category === "MSI";
  const isCancelled = Boolean(template.isCancelled);
  const isCompletedMsi =
    isMsi &&
    Boolean(template.totalInstallments) &&
    (template.currentInstallment ?? 0) >= (template.totalInstallments ?? 0);

  const cardName = cards.find((c) => c.id === template.cardId)?.name;
  const personName = people.find((p) => p.id === template.split?.personId)?.name;

  async function handleToggleActive() {
    setPendingToggleActive(true);
    setActionError("");
    try {
      const updated = await clientRequest<RecurringTemplate>(
        `/recurring/${template.id}`,
        {
          method: "PATCH",
          body: { isActive: !template.isActive },
        },
      );
      setTemplate(updated);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No pudimos cambiar el estado del compromiso.",
      );
    } finally {
      setPendingToggleActive(false);
    }
  }

  async function handleCancelCommitment() {
    setPendingCancel(true);
    setActionError("");
    try {
      const updated = await clientRequest<RecurringTemplate>(
        `/recurring/${template.id}/cancel`,
        {
          method: "PATCH",
        },
      );
      setTemplate(updated);
      setCancelDialogOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No pudimos cancelar el compromiso.",
      );
    } finally {
      setPendingCancel(false);
    }
  }

  async function handleDeleteCommitment() {
    setPendingDelete(true);
    setActionError("");
    try {
      await clientRequest(`/recurring/${template.id}`, {
        method: "DELETE",
      });
      router.push("/recurring");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No pudimos eliminar la plantilla recurrente.",
      );
      setPendingDelete(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/recurring" className="muted" style={{ fontSize: "0.875rem" }}>
          ← Volver a servicios y recurrentes
        </Link>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <RecurringCard
          template={template}
          cardName={cardName}
          personName={personName}
          linked={false}
        />
      </div>

      <div className="actions-bar" style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!isCancelled && (
            <button
              className="button secondary"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cerrar edición" : "Editar compromiso"}
            </button>
          )}

          {/* Pause / Resume */}
          {!isCancelled && !isCompletedMsi && (
            <button
              className="button secondary"
              disabled={pendingToggleActive}
              onClick={handleToggleActive}
            >
              {pendingToggleActive
                ? "Actualizando…"
                : template.isActive
                  ? "Pausar compromiso"
                  : "Reanudar compromiso"}
            </button>
          )}

          {/* Advance MSI */}
          {isMsi && !isCancelled && !isCompletedMsi && (
            <button
              className="button secondary"
              onClick={() => setAdvanceModalOpen(true)}
            >
              Adelantar cuotas / Liquidar
            </button>
          )}

          {/* Cancel */}
          {!isCancelled && (
            <button
              className="button danger"
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancelar compromiso
            </button>
          )}

          {/* Delete */}
          <button
            className="button secondary"
            style={{ color: "var(--red)" }}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Eliminar
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ marginTop: "16px", maxWidth: "560px" }}>
          <ErrorState message={actionError} />
        </div>
      )}

      {editing && (
        <div style={{ marginTop: "24px", maxWidth: "560px" }}>
          <RecurringForm
            template={template}
            cards={cards}
            people={people}
            onSuccess={(updated) => {
              setTemplate(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Advance MSI Modal */}
      {isMsi && (
        <MsiAdvanceModal
          open={advanceModalOpen}
          template={template}
          onClose={() => setAdvanceModalOpen(false)}
          onSuccess={(updated) => {
            setTemplate(updated);
          }}
        />
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="¿Cancelar este compromiso?"
        pending={pendingCancel}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelCommitment}
      >
        <p style={{ color: "var(--text)", margin: "0 0 12px" }}>
          Al cancelar <strong>{template.title}</strong>, ya no se generarán nuevos
          cargos mensuales para este compromiso en periodos futuros.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
          Los gastos e historial de periodos previos se conservan intactos. Esta
          acción no se puede revertir.
        </p>
      </ConfirmDialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="¿Eliminar plantilla recurrente?"
        pending={pendingDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCommitment}
      >
        <p style={{ color: "var(--text)", margin: "0 0 12px" }}>
          Esta acción desactivará la plantilla de <strong>{template.title}</strong>{" "}
          del sistema.
        </p>
      </ConfirmDialog>
    </div>
  );
}
