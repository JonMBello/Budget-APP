import Link from "next/link";
export default function MorePage() {
  return (
    <>
      <p className="eyebrow">TU ESPACIO</p>
      <h1>Más</h1>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
        <Link className="button secondary" href="/budgets">
          Historial de presupuestos
        </Link>
        <Link className="button secondary" href="/cards">
          Tarjetas y cuentas
        </Link>
        <Link className="button secondary" href="/people">
          Directorio de personas
        </Link>
        <Link className="button secondary" href="/settings/profile">
          Perfil y sesión
        </Link>
      </div>
    </>
  );
}
