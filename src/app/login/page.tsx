import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/features/auth/auth-layout";
import { AuthForm } from "@/features/auth/auth-form";
export const metadata: Metadata = { title: "Iniciar sesión" };
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return <AuthLayout title="Iniciar sesión" subtitle="Tu presupuesto empieza contigo."><Suspense><AuthForm registrationAllowed={process.env.BUDGET_APP_ALLOW_REGISTRATION === "true"} /></Suspense></AuthLayout>;
}
