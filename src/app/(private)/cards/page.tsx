import { z } from "zod";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { CardList } from "@/features/cards/card-list";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  await requireUser();
  let cards: Card[] = [];
  try {
    const result = await authenticatedRequest<unknown[]>("/cards?includeInactive=true");
    cards = z.array(cardSchema).parse(result);
  } catch {
    cards = [];
  }

  return (
    <>
      <p className="eyebrow">CUENTAS Y TARJETAS</p>
      <h1>Métodos de pago</h1>
      <p className="muted">
        Administra tus tarjetas de crédito, cuentas bancarias y efectivo para tus
        movimientos presupuestarios.
      </p>
      <CardList initialCards={cards} />
    </>
  );
}
