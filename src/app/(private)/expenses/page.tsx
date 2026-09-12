import { z } from "zod";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { validPeriod } from "@/lib/format";
import { authenticatedRequest, requireUser } from "@/lib/server/session";
import {
  budgetPeriodSchema,
  parsePeriodKey,
  type BudgetPeriod,
} from "@/features/budgets/contracts";
import { cardSchema, type Card } from "@/features/cards/contracts";
import { personSchema, type Person } from "@/features/people/contracts";
import { expenseSchema, type Expense } from "@/features/transactions/contracts";
import { TransactionsList } from "@/features/transactions/transactions-list";

export const dynamic = "force-dynamic";

export default async function ExpensesPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireUser();
  const searchParams = await props.searchParams;
  const requestedPeriod = validPeriod(searchParams.period ?? null);

  let allPeriods: BudgetPeriod[] = [];
  try {
    const raw = await authenticatedRequest<unknown[]>("/budgets");
    allPeriods = z.array(budgetPeriodSchema).parse(raw);
  } catch {
    allPeriods = [];
  }

  let activePeriod: BudgetPeriod | null = null;
  if (requestedPeriod) {
    const parsed = parsePeriodKey(requestedPeriod);
    if (parsed) {
      const found = allPeriods.find(
        (p) => p.year === parsed.year && p.month === parsed.month,
      );
      if (found) {
        activePeriod = found;
      } else {
        try {
          const raw = await authenticatedRequest<unknown>(
            `/budgets/${parsed.year}/${parsed.month}`,
          );
          activePeriod = budgetPeriodSchema.parse(raw);
        } catch {
          activePeriod = null;
        }
      }
    }
  }

  if (!activePeriod) {
    try {
      const raw = await authenticatedRequest<unknown>("/budgets/current");
      activePeriod = budgetPeriodSchema.parse(raw);
    } catch {
      activePeriod = allPeriods[0] ?? null;
    }
  }

  if (!activePeriod) {
    return (
      <div className="page-container">
        <EmptyState
          title="No hay periodos presupuestarios"
          action={
            <Link className="button" href="/">
              Ir al inicio a crear un mes
            </Link>
          }
        >
          Para registrar gastos, primero necesitas inicializar al menos un mes en tu presupuesto.
        </EmptyState>
      </div>
    );
  }

  let expenses: Expense[] = [];
  try {
    const rawExpenses = await authenticatedRequest<unknown[]>(
      `/expenses?periodId=${encodeURIComponent(activePeriod.id)}`,
    );
    expenses = z.array(expenseSchema).parse(rawExpenses);
  } catch {
    expenses = [];
  }

  let cards: Card[] = [];
  try {
    const rawCards = await authenticatedRequest<unknown[]>("/cards");
    cards = z.array(cardSchema).parse(rawCards);
  } catch {
    cards = [];
  }

  let people: Person[] = [];
  try {
    const rawPeople = await authenticatedRequest<unknown[]>("/people");
    people = z.array(personSchema).parse(rawPeople);
  } catch {
    people = [];
  }

  return (
    <TransactionsList
      type="expenses"
      period={activePeriod}
      allPeriods={allPeriods}
      initialExpenses={expenses}
      cards={cards}
      people={people}
    />
  );
}
