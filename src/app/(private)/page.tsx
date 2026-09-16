import { z } from "zod";
import {
  budgetPeriodSchema,
  parsePeriodKey,
  type BudgetPeriod,
} from "@/features/budgets/contracts";
import { BudgetDashboard } from "@/features/budgets/budget-dashboard";
import { validPeriod } from "@/lib/format";
import { authenticatedRequest, requireUser } from "@/lib/server/session";

export default async function HomePage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireUser();
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

  let initialSummary = null;
  let initialExpenses: import("@/features/transactions/contracts").Expense[] = [];
  let initialIncomes: import("@/features/transactions/contracts").Income[] = [];
  let initialCards: import("@/features/cards/contracts").Card[] = [];
  let initialPeople: import("@/features/people/contracts").Person[] = [];

  if (activePeriod) {
    const period = activePeriod;
    const [summaryRes, expensesRes, incomesRes, cardsRes, peopleRes] = await Promise.allSettled([
      authenticatedRequest<unknown>(`/budgets/${period.year}/${period.month}/summary`),
      authenticatedRequest<unknown[]>(`/expenses?periodId=${period.id}`),
      authenticatedRequest<unknown[]>(`/incomes?periodId=${period.id}`),
      authenticatedRequest<unknown[]>("/cards"),
      authenticatedRequest<unknown[]>("/people"),
    ]);

    if (summaryRes.status === "fulfilled") {
      try {
        initialSummary = (await import("@/features/budgets/contracts")).budgetSummarySchema.parse(summaryRes.value);
      } catch {
        initialSummary = null;
      }
    }

    if (expensesRes.status === "fulfilled") {
      try {
        const { expenseSchema } = await import("@/features/transactions/contracts");
        initialExpenses = z.array(expenseSchema).parse(expensesRes.value);
      } catch {
        initialExpenses = [];
      }
    }

    if (incomesRes.status === "fulfilled") {
      try {
        const { incomeSchema } = await import("@/features/transactions/contracts");
        initialIncomes = z.array(incomeSchema).parse(incomesRes.value);
      } catch {
        initialIncomes = [];
      }
    }

    if (cardsRes.status === "fulfilled") {
      try {
        const { cardSchema } = await import("@/features/cards/contracts");
        initialCards = z.array(cardSchema).parse(cardsRes.value);
      } catch {
        initialCards = [];
      }
    }

    if (peopleRes.status === "fulfilled") {
      try {
        const { personSchema } = await import("@/features/people/contracts");
        initialPeople = z.array(personSchema).parse(peopleRes.value);
      } catch {
        initialPeople = [];
      }
    }
  }

  return (
    <BudgetDashboard
      key={activePeriod?.id ?? "no-period"}
      userName={user.name}
      initialPeriod={activePeriod}
      allPeriods={allPeriods}
      initialSummary={initialSummary}
      initialExpenses={initialExpenses}
      initialIncomes={initialIncomes}
      initialCards={initialCards}
      initialPeople={initialPeople}
    />
  );
}
