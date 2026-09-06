import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/server/session";
export default async function HomePage() {
  const user = await requireUser();
  return <><p className="eyebrow">TU ESPACIO PERSONAL</p><h1>Hola, {user.name}.</h1><EmptyState title="Un nuevo comienzo" action={<Link className="button secondary" href="/settings/profile">Revisar mi perfil</Link>}>Tu presupuesto mensual aparecerá aquí. Por ahora, puedes revisar los datos de tu cuenta.</EmptyState></>;
}
