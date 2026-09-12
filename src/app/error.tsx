"use client";
import { ErrorState } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="page-container"><ErrorState message="No pudimos cargar esta página. Tus datos guardados siguen a salvo." retry={reset} /></main>; }
