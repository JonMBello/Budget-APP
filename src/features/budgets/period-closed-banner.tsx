import { Icon } from "@/components/icon";

export function PeriodClosedBanner() {
  return (
    <div
      className="period-closed-banner"
      role="status"
      aria-label="Periodo cerrado en solo lectura"
    >
      <Icon name="lock" />
      <div>
        <strong>Periodo cerrado (solo lectura):</strong> Las altas, modificaciones y
        eliminaciones de gastos, ingresos o cobros están desactivadas en este mes para
        proteger la integridad de tu historial financiero.
      </div>
    </div>
  );
}
