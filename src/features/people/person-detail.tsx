"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { PersonCard } from "./person-card";
import { PersonForm } from "./person-form";
import { DebtSummaryView } from "./debt-summary-view";
import { type Person } from "./contracts";

export function PersonDetail({ initialPerson }: { initialPerson: Person }) {
  const [person, setPerson] = useState<Person>(initialPerson);
  const [editing, setEditing] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  async function handleArchive() {
    setPendingArchive(true);
    setArchiveError("");
    try {
      await clientRequest(`/people/${person.id}`, { method: "DELETE" });
      setPerson({ ...person, isActive: false });
      setArchiveDialogOpen(false);
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : "No pudimos archivar a la persona.",
      );
    } finally {
      setPendingArchive(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/people" className="muted" style={{ fontSize: "0.875rem" }}>
          ← Volver al directorio de personas
        </Link>
      </div>

      <div style={{ maxWidth: "480px" }}>
        <PersonCard person={person} linked={false} />
      </div>

      <div className="actions-bar">
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="button secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cerrar edición" : "Editar información"}
          </button>

          {person.isActive && (
            <button
              className="button danger"
              onClick={() => setArchiveDialogOpen(true)}
            >
              Archivar persona
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
          <PersonForm
            person={person}
            onSuccess={(updated) => {
              setPerson(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <div style={{ marginTop: "32px", maxWidth: "720px" }}>
        <DebtSummaryView personId={person.id} />
      </div>

      <ConfirmDialog
        open={archiveDialogOpen}
        title="¿Archivar esta persona?"
        pending={pendingArchive}
        onCancel={() => setArchiveDialogOpen(false)}
        onConfirm={handleArchive}
      >
        <p>
          Al archivar a <strong>{person.name}</strong> se ocultará al registrar nuevos
          gastos compartidos. Sus deudas pendientes, cobros históricos y asignaciones se conservarán intactos.
        </p>
      </ConfirmDialog>
    </div>
  );
}
