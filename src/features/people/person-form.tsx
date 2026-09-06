"use client";

import { useState } from "react";
import { z } from "zod";
import { Field, ErrorState } from "@/components/ui";
import { ClientError, clientRequest } from "@/lib/client";
import {
  createPersonSchema,
  updatePersonSchema,
  type Person,
} from "./contracts";

export function PersonForm({
  person,
  onSuccess,
  onCancel,
}: {
  person?: Person;
  onSuccess?: (saved: Person) => void;
  onCancel?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});

  const isEditing = Boolean(person);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setFields({});

    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData);

    const schema = isEditing ? updatePersonSchema : createPersonSchema;
    const validation = schema.safeParse(raw);

    if (!validation.success) {
      setFields(z.flattenError(validation.error).fieldErrors);
      return;
    }

    setPending(true);
    try {
      const endpoint = isEditing ? `/people/${person!.id}` : "/people";
      const method = isEditing ? "PATCH" : "POST";
      const saved = await clientRequest<Person>(endpoint, {
        method,
        body: validation.data,
      });
      if (onSuccess) onSuccess(saved);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos guardar los datos de la persona.",
      );
      if (error instanceof ClientError && error.fields) {
        setFields(error.fields);
      }
      setPending(false);
    }
  }

  return (
    <form className="profile-card" onSubmit={submit} noValidate aria-busy={pending}>
      <Field
        label="Nombre completo o alias"
        name="name"
        defaultValue={person?.name}
        placeholder="ej. Laura Gómez, Hermano, Juan"
        required
        minLength={2}
        maxLength={100}
        hint="Al menos 2 caracteres para identificar a la persona."
        error={fields.name?.[0]}
      />

      <Field
        label="Contacto (opcional)"
        name="contact"
        defaultValue={person?.contact ?? ""}
        placeholder="ej. 55 1234 5678, correo@ejemplo.com"
        maxLength={100}
        hint="Teléfono o correo para recordatorios o acuerdos."
        error={fields.contact?.[0]}
      />

      <div className="field">
        <label htmlFor="person-notes">Notas (opcional)</label>
        <textarea
          id="person-notes"
          name="notes"
          defaultValue={person?.notes ?? ""}
          placeholder="ej. Cuenta compartida de Spotify, préstamo de viaje, etc."
          rows={3}
          maxLength={500}
        />
        {fields.notes?.[0] && <p className="field-error">{fields.notes[0]}</p>}
      </div>

      {message && (
        <div className="form-message">
          <ErrorState message={message} />
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button className="button" type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : isEditing
              ? "Guardar cambios"
              : "Registrar persona"}
        </button>
        {onCancel && (
          <button
            className="button secondary"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
