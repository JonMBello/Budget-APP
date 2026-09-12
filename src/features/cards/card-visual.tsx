import Link from "next/link";
import { type Card } from "./contracts";

const typeLabels: Record<Card["type"], string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  CASH: "Efectivo",
};

export function CardVisual({
  card,
  linked = true,
}: {
  card: Card;
  linked?: boolean;
}) {
  const content = (
    <>
      <div className="card-top">
        <div
          className="card-color-stripe"
          style={{ backgroundColor: card.color || "#10b981" }}
          aria-hidden="true"
        />
        <div className="card-badge-group">
          {!card.isActive && (
            <span className="card-type-tag" role="status">
              Archivada
            </span>
          )}
          <span className={`card-type-tag ${card.type.toLowerCase()}`}>
            {typeLabels[card.type]}
          </span>
        </div>
      </div>

      <h3 className="card-title">{card.name}</h3>

      {card.last4Digits ? (
        <div className="card-number" aria-label={`Terminación ${card.last4Digits}`}>
          •••• {card.last4Digits}
        </div>
      ) : (
        <div className="card-number" aria-hidden="true">
          •••• ••••
        </div>
      )}

      {card.type === "CREDIT" && card.cutoffDay && card.paymentDueDay && (
        <div className="card-cycles">
          <span>
            Corte: <strong>día {card.cutoffDay}</strong>
          </span>
          <span>
            Pago: <strong>día {card.paymentDueDay}</strong>
          </span>
        </div>
      )}
    </>
  );

  if (linked) {
    return (
      <Link
        href={`/cards/${card.id}`}
        className={`card-item ${!card.isActive ? "inactive" : ""}`}
        aria-label={`${card.name}, ${typeLabels[card.type]}${!card.isActive ? " (archivada)" : ""}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`card-item ${!card.isActive ? "inactive" : ""}`}>
      {content}
    </div>
  );
}
