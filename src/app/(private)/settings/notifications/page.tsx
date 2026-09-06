import { requireUser } from "@/lib/server/session";
import { PwaInstallGuide } from "@/features/notifications/pwa-install-guide";
import { PushSubscriptionCard } from "@/features/notifications/push-subscription-card";
import { NotificationTestCard } from "@/features/notifications/notification-test-card";
import { TriggerRemindersCard } from "@/features/notifications/trigger-reminders-card";

export default async function NotificationsPage() {
  const user = await requireUser();

  return (
    <>
      <p className="eyebrow">TU CONFIGURACIÓN</p>
      <h1>PWA y Notificaciones</h1>
      <p className="muted">
        Instalación en dispositivos Apple y configuración de recordatorios de vencimiento.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
        <PwaInstallGuide />
        <PushSubscriptionCard />
        <NotificationTestCard userEmail={user.email} />
        <TriggerRemindersCard />
      </div>
    </>
  );
}
