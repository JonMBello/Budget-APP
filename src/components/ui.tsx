"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { formatMoney, type Currency } from "@/lib/format";
import { Icon } from "./icon";

export function Money({ amount, currency = "MXN" }: { amount: number; currency?: Currency }) {
  return <span className={`money ${amount < 0 ? "negative" : ""}`}>{formatMoney(amount, currency)}</span>;
}
export function Field({ label, error, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const generated = useId();
  const id = props.id ?? generated;
  return <div className="field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-help` : undefined} />{(error || hint) && <p id={`${id}-help`} className={error ? "field-error" : "field-hint"}>{error || hint}</p>}</div>;
}
export function AmountField(props: Omit<React.ComponentProps<typeof Field>, "type" | "inputMode">) { return <Field {...props} type="text" inputMode="decimal" placeholder={props.placeholder ?? "0.00"} />; }
export function DateField(props: Omit<React.ComponentProps<typeof Field>, "type">) { return <Field {...props} type="date" />; }
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <section className="empty-state"><span className="empty-icon"><Icon name="wallet" /></span><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>;
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-state" role="alert"><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Volver a intentar</button>}</div>;
}
export function LoadingState() { return <div className="loading-state" role="status"><span className="loading-dot" />Cargando tu presupuesto…</div>; }
export function ConfirmDialog({ open, title, children, pending = false, onCancel, onConfirm }: { open: boolean; title: string; children: ReactNode; pending?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (open && previous instanceof HTMLElement) previous.focus(); };
  }, [open]);
  return <dialog className="confirm-dialog" ref={ref} aria-labelledby={heading} onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }}><h2 id={heading}>{title}</h2><div>{children}</div><div className="dialog-actions"><button autoFocus className="button secondary" disabled={pending} onClick={onCancel}>Cancelar</button><button className="button danger" disabled={pending} onClick={onConfirm}>{pending ? "Guardando…" : "Confirmar"}</button></div></dialog>;
}
