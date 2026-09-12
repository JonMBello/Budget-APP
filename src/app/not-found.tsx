import Link from "next/link";
import { EmptyState } from "@/components/ui";
export default function NotFound() { return <main id="main" className="page-container"><EmptyState title="No encontramos esta página" action={<Link className="button" href="/">Volver al inicio</Link>}>El enlace puede haber cambiado.</EmptyState></main>; }
