import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

export const metadata: Metadata = { title: "Iniciar sesión" };
export default function LoginPage() {
  return <main id="main" className="auth-page"><div className="auth-top"><Brand linked={false} /><span className="private-label"><Icon name="lock" />Finanzas personales</span></div><div className="auth-grid"><section className="auth-intro"><p className="eyebrow">CADA MES, MÁS CLARIDAD</p><h1>Tu dinero.<br />Tus planes.<br /><span>Todo en orden.</span></h1><p className="intro-copy">Un lugar para tu presupuesto, tus compromisos y lo que viene después.</p><div className="intro-rule" /><div className="intro-notes"><span><i className="dot green" />Ingresos</span><span><i className="dot red" />Gastos</span><span><i className="dot blue" />Ahorro</span></div></section><section className="auth-card" aria-labelledby="login-title"><span className="card-kicker">BIENVENIDO A TU ESPACIO</span><h2 id="login-title">Iniciar sesión</h2><p className="muted">Tu presupuesto empieza contigo.</p><div className="setup-notice" role="status">Estamos preparando el acceso seguro a tu presupuesto.</div><div className="auth-footnote"><Icon name="lock" /><p>Tus finanzas son personales.<br />Tu acceso también.</p></div></section></div><footer className="auth-footer"><span>Budget · Tu espacio personal</span><span>Un mes a la vez.</span></footer></main>;
}
