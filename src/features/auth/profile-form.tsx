"use client";
import { useState } from "react";
import { Field, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { profileSchema, type User } from "./contracts";
export function ProfileForm({ user }: { user: User }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return; setError(""); setSaved(false);
    const body = profileSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!body.success) { setError("Revisa tu nombre y moneda."); return; }
    setPending(true);
    try { await clientRequest("/profile", { method: "PATCH", body: body.data }); setSaved(true); } catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar tu perfil."); } finally { setPending(false); }
  }
  return <form className="profile-card" onSubmit={submit}><Field name="name" label="Nombre" defaultValue={user.name} required minLength={2} maxLength={120} /><Field label="Correo electrónico" value={user.email} readOnly hint="Este es el correo de tu cuenta." /><div className="field"><label htmlFor="currency">Moneda</label><select id="currency" name="currency" defaultValue={user.currency}><option value="MXN">Peso mexicano · MXN</option><option value="USD">Dólar estadounidense · USD</option></select><p className="field-hint">Solo se puede cambiar antes de crear presupuestos o movimientos.</p></div>{error && <ErrorState message={error} />}{saved && <p className="success-message" role="status">Tu perfil se guardó.</p>}<button className="button" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</button></form>;
}
export function LogoutButton() {
  const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function logout() {
    if (pending) return; setPending(true); setError("");
    try { await clientRequest("/auth/logout", { method: "POST", body: {} }); window.location.replace("/app/login"); } catch { setError("Necesitas conexión para cerrar la sesión de este dispositivo. Inténtalo de nuevo."); setPending(false); }
  }
  return <div className="logout-area"><button className="button secondary" onClick={logout} disabled={pending}>{pending ? "Cerrando…" : "Cerrar sesión"}</button>{error && <ErrorState message={error} />}</div>;
}
