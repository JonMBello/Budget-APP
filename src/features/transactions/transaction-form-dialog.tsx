"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function TransactionFormDialog({ title, pending, onCancel, children }: {
  title: string;
  pending: boolean;
  onCancel: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  return (
    <dialog ref={ref} className="transaction-form-dialog" aria-label={title}
      onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }}>
      {children}
    </dialog>
  );
}
