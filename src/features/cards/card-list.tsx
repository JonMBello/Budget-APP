"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import { CardVisual } from "./card-visual";
import { CardForm } from "./card-form";
import { type Card } from "./contracts";

export function CardList({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);

  const displayedCards = showArchived
    ? cards
    : cards.filter((c) => c.isActive);

  return (
    <div>
      <div className="actions-bar">
        <div className="filter-tabs" role="group" aria-label="Filtrar por estado">
          <button
            type="button"
            className="filter-tab"
            aria-pressed={!showArchived}
            onClick={() => setShowArchived(false)}
          >
            Activas ({cards.filter((c) => c.isActive).length})
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={showArchived}
            onClick={() => setShowArchived(true)}
          >
            Todas ({cards.length})
          </button>
        </div>

        <button
          className="button"
          type="button"
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Cerrar" : "+ Agregar método de pago"}
        </button>
      </div>

      {adding && (
        <div style={{ margin: "24px 0" }}>
          <CardForm
            onSuccess={(newCard) => {
              setCards([newCard, ...cards]);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {displayedCards.length === 0 ? (
        <EmptyState
          title={showArchived ? "Sin métodos registrados" : "No tienes cuentas activas"}
          action={
            !adding && (
              <button
                className="button secondary"
                onClick={() => setAdding(true)}
                style={{ marginTop: "16px" }}
              >
                Agregar tu primera tarjeta o cuenta
              </button>
            )
          }
        >
          Registra tus tarjetas de crédito, cuentas de débito o efectivo para asociar
          tus compras y planear tus pagos.
        </EmptyState>
      ) : (
        <div className="cards-grid" role="list">
          {displayedCards.map((card) => (
            <CardVisual key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
