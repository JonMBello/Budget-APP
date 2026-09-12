"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { periodHref } from "@/lib/format";
import { isCurrentMoreLink, isMoreSection, MORE_LINKS } from "./more-links";

export function MoreNav() {
  const path = usePathname();
  const period = useSearchParams().get("period");
  const scroller = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLElement>("[aria-current='page']");
    if (typeof active?.scrollIntoView === "function") {
      active.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
    }
  }, [path]);

  if (!isMoreSection(path)) {
    return null;
  }

  return (
    <nav ref={scroller} className="more-nav" aria-label="Más opciones">
      {MORE_LINKS.map((item) => (
        <Link
          key={item.href}
          href={periodHref(item.href, period)}
          className="more-nav-link"
          aria-current={isCurrentMoreLink(path, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
