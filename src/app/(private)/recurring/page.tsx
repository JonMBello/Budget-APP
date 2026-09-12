import { validPeriod } from "@/lib/format";
import { budgetPeriodSchema, toPeriodKey, type BudgetPeriod } from "@/features/budgets/contracts";
import { PeriodSelector } from "@/features/budgets/period-selector";
import { z } from "zod";
import { recurringTemplateSchema, type RecurringTemplate } from "@/features/recurring/contracts";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { personSchema, type Person } from "@/features/people/contracts";
import { RecurringList } from "@/features/recurring/recurring-list";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function RecurringPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireUser();

  const query = await searchParams;
  const requestedPeriod = validPeriod(query.period ?? null);
  let periods: BudgetPeriod[] = [];
  let period: BudgetPeriod | null = null;
  try {
    periods = z.array(budgetPeriodSchema).parse(await authenticatedRequest<unknown>("/budgets"));
    if (query.period !== undefined) {
      period = periods.find((item) => toPeriodKey(item.year, item.month) === requestedPeriod) ?? null;
    } else {
      period = budgetPeriodSchema.parse(await authenticatedRequest<unknown>("/budgets/current"));
    }
  } catch {
    // Do not silently substitute another month when the destination cannot be confirmed.
  }

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
      <PeriodSelector periods={periods} currentPeriod={period} />
      <RecurringList key={period?.id ?? "no-period"} period={period} initialTemplates={templates} cards={cards} people={people} />
    </>
  );
}
