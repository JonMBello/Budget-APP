"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { CardVisual } from "./card-visual";
import { CardForm } from "./card-form";
import { PurchaseSimulator } from "./purchase-simulator";
import { type Card } from "./contracts";

export function CardDetail({ initialCard }: { initialCard: Card }) {
  const [card, setCard] = useState<Card>(initialCard);
  const [editing, setEditing] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  async function handleArchive() {
    setPendingArchive(true);
    setArchiveError("");
    try {
      await clientRequest(`/cards/${card.id}`, { method: "DELETE" });
      setCard({ ...card, isActive: false });
      setArchiveDialogOpen(false);
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : "No pudimos archivar la tarjeta.",
      );
    } finally {
      setPendingArchive(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/cards" className="muted" style={{ fontSize: "0.875rem" }}>
          ← Volver a métodos de pago
        </Link>
      </div>

      <div style={{ maxWidth: "480px" }}>
        <CardVisual card={card} linked={false} />
      </div>

      <div className="actions-bar">
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="button secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cerrar edición" : "Editar método de pago"}
          </button>

          {card.isActive && (
            <button
              className="button danger"
              onClick={() => setArchiveDialogOpen(true)}
            >
              Archivar tarjeta
            </button>
          )}
        </div>
      </div>

      {archiveError && (
        <div style={{ marginTop: "16px", maxWidth: "480px" }}>
          <ErrorState message={archiveError} />
        </div>
      )}

      {editing && (
        <div style={{ marginTop: "24px" }}>
          <CardForm
            card={card}
            onSuccess={(updated) => {
              setCard(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {card.type === "CREDIT" && (
        <div style={{ marginTop: "32px", maxWidth: "720px" }}>
          <PurchaseSimulator cardId={card.id} />
        </div>
      )}

      <ConfirmDialog
        open={archiveDialogOpen}
        title="¿Archivar este método de pago?"
        pending={pendingArchive}
        onCancel={() => setArchiveDialogOpen(false)}
        onConfirm={handleArchive}
      >
        <p>
          Al archivar <strong>{card.name}</strong> se ocultará al registrar nuevas
          compras o gastos. Los movimientos y el historial existentes se conservarán intactos.
        </p>
      </ConfirmDialog>
    </div>
  );
}
