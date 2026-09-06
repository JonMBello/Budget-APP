"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { periodHref } from "@/lib/format";
import { Brand } from "./brand";
import { Icon, type IconName } from "./icon";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/incomes", label: "Ingresos", icon: "income" },
  { href: "/expenses", label: "Gastos", icon: "expense" },
  { href: "/more", label: "Más", icon: "more" },
];
export function Navigation() {
  const path = usePathname();
  const period = useSearchParams().get("period");
  return <header className="app-header"><Brand /><nav className="primary-nav" aria-label="Navegación principal">{items.map((item) => <Link key={item.href} href={periodHref(item.href, period)} aria-current={path === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav><span className="private-label"><Icon name="lock" />Tu espacio personal</span></header>;
}
