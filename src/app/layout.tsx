import type { Metadata, Viewport } from "next";
import { ConnectionStatus } from "@/components/connection-status";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Budget · Finanzas personales", template: "%s · Budget" },
  description: "Tu presupuesto mensual, tus gastos y tus próximos pagos en un solo lugar.",
  manifest: "/app/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Budget",
  },
  icons: {
    icon: "/app/icon.svg",
    apple: "/app/apple-icon.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b1220", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <ConnectionStatus />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
