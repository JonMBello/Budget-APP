import Link from "next/link";

export function Brand({ linked = true }: { linked?: boolean }) {
  const content = <><span className="brand-mark" aria-hidden="true">b<span>.</span></span><span>budget<span className="brand-dot">.</span></span></>;
  return linked ? <Link className="brand" href="/" aria-label="Budget, inicio">{content}</Link> : <span className="brand">{content}</span>;
}
