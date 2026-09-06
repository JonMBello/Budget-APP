import type { BudgetStatus } from "./contracts";

export function PeriodStatusBadge({ status }: { status: BudgetStatus }) {
  const isOpen = status === "OPEN";
  return (
    <span
      className={`status-badge ${isOpen ? "open" : "closed"}`}
      aria-label={`Estado del periodo: ${isOpen ? "Abierto para edición" : "Cerrado, solo lectura"}`}
    >
      <span className={`dot ${isOpen ? "green" : "blue"}`} aria-hidden="true" />
      {isOpen ? "Abierto" : "Cerrado"}
    </span>
  );
}
