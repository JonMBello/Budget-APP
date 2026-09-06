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

  return (
    <BudgetDashboard
      userName={user.name}
      initialPeriod={activePeriod}
      allPeriods={allPeriods}
    />
  );
}
