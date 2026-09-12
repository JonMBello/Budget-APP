"use client";

import { useEffect, useId, useRef, useState } from "react";

export function InfoTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });

  function show() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(320, window.innerWidth - 32);
      setPosition({
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: Math.max(16, Math.min(rect.bottom, window.innerHeight - 240)),
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return <span ref={ref} className="info-tooltip" onMouseEnter={show}
    onMouseLeave={() => { if (!ref.current?.contains(document.activeElement)) setOpen(false); }}>
    <button type="button" className="info-tooltip-trigger" aria-label={`Información sobre ${label}`}
      aria-describedby={open ? id : undefined} onFocus={show} onBlur={() => setOpen(false)} onClick={show}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v1" />
      </svg>
    </button>
    <span id={id} role="tooltip" hidden={!open} className="info-tooltip-content"
      style={{ ...position, maxHeight: `calc(100dvh - ${position.top + 16}px)` }}>{children}</span>
  </span>;
}
