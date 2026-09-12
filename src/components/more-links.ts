export const MORE_LINKS = [
  { href: "/settings/profile", label: "Perfil y sesión" },
  { href: "/budgets", label: "Historial de presupuestos" },
  { href: "/recurring", label: "Servicios, suscripciones y MSI" },
  { href: "/cards", label: "Tarjetas y cuentas" },
  { href: "/people", label: "Directorio de personas" },
  { href: "/settings/notifications", label: "PWA y notificaciones" },
] as const;

export const MORE_HOME = MORE_LINKS[0].href;

export function isMoreSection(path: string): boolean {
  if (path === "/more" || path.startsWith("/more/")) {
    return true;
  }
  return MORE_LINKS.some((item) => path === item.href || path.startsWith(`${item.href}/`));
}

export function isCurrentMoreLink(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}
