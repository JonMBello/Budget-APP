"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { periodHref } from "@/lib/format";
import { isMoreSection, MORE_HOME } from "./more-links";
import { Brand } from "./brand";
import { Icon, type IconName } from "./icon";

const items: { href: string; label: string; icon: IconName; section?: "more" }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/incomes", label: "Ingresos", icon: "income" },
  { href: "/expenses", label: "Gastos", icon: "expense" },
  { href: MORE_HOME, label: "Más", icon: "more", section: "more" },
];

function currentState(item: (typeof items)[number], path: string): "page" | "true" | undefined {
  if (item.section === "more") {
    return isMoreSection(path) ? "true" : undefined;
  }
  return path === item.href ? "page" : undefined;
}

export function Navigation() {
  const path = usePathname();
  const period = useSearchParams().get("period");
  return <header className="app-header"><Brand /><nav className="primary-nav" aria-label="Navegación principal">{items.map((item) => <Link key={item.href} href={periodHref(item.href, period)} aria-current={currentState(item, path)}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav><span className="private-label"><Icon name="lock" />Tu espacio personal</span></header>;
}
