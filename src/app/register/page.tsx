import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthLayout } from "@/features/auth/auth-layout";
import { AuthForm } from "@/features/auth/auth-form";
export const dynamic = "force-dynamic";
export default function RegisterPage() {
  if (process.env.BUDGET_APP_ALLOW_REGISTRATION !== "true") notFound();
  return <AuthLayout title="Crear tu cuenta" subtitle="Empieza con tu código de invitación."><Suspense><AuthForm mode="register" /></Suspense></AuthLayout>;
}
