import { z } from "zod";
import { recurringTemplateSchema, type RecurringTemplate } from "@/features/recurring/contracts";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { personSchema, type Person } from "@/features/people/contracts";
import { RecurringList } from "@/features/recurring/recurring-list";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  await requireUser();

  let templates: RecurringTemplate[] = [];
  let cards: Card[] = [];
  let people: Person[] = [];

  try {
    const result = await authenticatedRequest<unknown[]>("/recurring?includeInactive=true");
    templates = z.array(recurringTemplateSchema).parse(result);
  } catch {
    templates = [];
  }

  try {
    const resultCards = await authenticatedRequest<unknown[]>("/cards");
    cards = z.array(cardSchema).parse(resultCards);
  } catch {
    cards = [];
  }

  try {
    const resultPeople = await authenticatedRequest<unknown[]>("/people");
    people = z.array(personSchema).parse(resultPeople);
  } catch {
    people = [];
  }

  return (
    <>
      <p className="eyebrow">COMPROMISOS MENSUALES</p>
      <h1>Servicios, suscripciones y MSI</h1>
      <p className="muted">
        Administra tus gastos fijos recurrentes y compras a Meses Sin Intereses para
        mantener tu presupuesto automatizado y bajo control.
      </p>
      <RecurringList initialTemplates={templates} cards={cards} people={people} />
    </>
  );
}
