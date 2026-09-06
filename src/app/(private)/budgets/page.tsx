import Link from "next/link";
import { z } from "zod";
import { budgetPeriodSchema, type BudgetPeriod } from "@/features/budgets/contracts";
import { BudgetHistoryView } from "@/features/budgets/budget-history-view";
import { authenticatedRequest } from "@/lib/server/session";

export default async function BudgetsPage() {
  let periods: BudgetPeriod[] = [];
  try {
    const raw = await authenticatedRequest<unknown[]>("/budgets");
    periods = z.array(budgetPeriodSchema).parse(raw);
  } catch {
    periods = [];
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "6px" }}>
            HISTORIAL FINANCIERO
          </p>
          <h1 style={{ margin: 0 }}>Historial de presupuestos</h1>
        </div>
        <Link className="button secondary" href="/">
          ← Ir al mes activo
        </Link>
      </div>

      <BudgetHistoryView initialPeriods={periods} />
    </div>
  );
}
