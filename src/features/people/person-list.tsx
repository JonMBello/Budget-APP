"use client";

import { useState } from "react";
import { EmptyState, Field } from "@/components/ui";
import { PersonCard } from "./person-card";
import { PersonForm } from "./person-form";
import { type Person } from "./contracts";

export function PersonList({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const query = search.trim().toLowerCase();

  const displayed = people.filter((p) => {
    if (!showArchived && !p.isActive) return false;
    if (!query) return true;
    const nameMatch = p.name.toLowerCase().includes(query);
    const contactMatch = p.contact?.toLowerCase().includes(query) ?? false;
    return nameMatch || contactMatch;
  });

  const activeCount = people.filter((p) => p.isActive).length;

  return (
    <div>
      <div className="actions-bar">
        <div className="filter-tabs" role="group" aria-label="Filtrar personas">
          <button
            type="button"
            className="filter-tab"
            aria-pressed={!showArchived}
            onClick={() => setShowArchived(false)}
          >
            Activas ({activeCount})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={showArchived}
            onClick={() => setShowArchived(true)}
          >
            Todas ({people.length})
          </button>
        </div>

        <button
          className="button"
          type="button"
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Cerrar" : "+ Agregar persona"}
        </button>
      </div>

      <div style={{ maxWidth: "360px", marginTop: "16px" }}>
        <Field
          label="Buscar persona"
          placeholder="Buscar por nombre o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {adding && (
        <div style={{ margin: "24px 0" }}>
          <PersonForm
            onSuccess={(newPerson) => {
              setPeople([newPerson, ...people]);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          title={
            search
              ? "No encontramos coincidencias"
              : showArchived
                ? "Sin personas registradas"
                : "No tienes personas activas"
          }
          action={
            !adding &&
            !search && (
              <button
                className="button secondary"
                onClick={() => setAdding(true)}
                style={{ marginTop: "16px" }}
              >
                Agregar tu primera persona
              </button>
            )
          }
        >
          {search
            ? "Intenta con otro nombre o término de búsqueda."
            : "Registra personas para dividir cuentas, registrar préstamos o compras compartidas."}
        </EmptyState>
      ) : (
        <div className="people-grid" role="list">
          {displayed.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
