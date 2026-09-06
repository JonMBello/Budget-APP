"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Field, ErrorState } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ClientError, clientRequest } from "@/lib/client";
import { loginSchema, registerSchema, safeReturnTo } from "./contracts";

export function AuthForm({ mode = "login", registrationAllowed = false }: { mode?: "login" | "register"; registrationAllowed?: boolean }) {
  const query = useSearchParams();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const register = mode === "register";
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    setMessage(""); setFields({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = (register ? registerSchema : loginSchema).safeParse(data);
    if (!result.success) { setFields(z.flattenError(result.error).fieldErrors); return; }
    setPending(true);
    try {
      await clientRequest(`/auth/${mode}`, { method: "POST", body: result.data });
      window.location.assign(safeReturnTo(query.get("returnTo")));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
      if (error instanceof ClientError && error.fields) setFields(error.fields);
      setPending(false);
    }
  }
  return <form onSubmit={submit} noValidate aria-busy={pending}>
    {register && <Field label="Tu nombre" name="name" autoComplete="name" required maxLength={120} error={fields.name?.[0]} />}
    <Field label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" autoComplete="username" required maxLength={254} error={fields.email?.[0]} />
    <Field label="Contraseña" name="password" type="password" placeholder={register ? "Al menos 8 caracteres" : "Tu contraseña"} autoComplete={register ? "new-password" : "current-password"} required maxLength={1024} error={fields.password?.[0]} />
    {register && <><Field label="Código de invitación" name="inviteCode" autoComplete="off" required error={fields.inviteCode?.[0]} /><input type="hidden" name="currency" value="MXN" /></>}
    {message && <div className="form-message"><ErrorState message={message} /></div>}
    <button className="button full" type="submit" disabled={pending}>{pending ? "Un momento…" : register ? "Crear mi cuenta" : "Entrar a mi presupuesto"}<Icon name="arrow" /></button>
    {(registrationAllowed || register) && <p className="auth-alternative">{register ? "¿Ya tienes una cuenta?" : "¿Tienes una invitación?"} <Link href={register ? "/login" : "/register"}>{register ? "Inicia sesión" : "Crear cuenta"}</Link></p>}
  </form>;
}
