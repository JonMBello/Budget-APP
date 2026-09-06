import { Suspense } from "react";
import { Navigation } from "@/components/navigation";
import { requireUser } from "@/lib/server/session";
export const dynamic = "force-dynamic";
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <><Suspense><Navigation /></Suspense><main id="main" className="page-container">{children}</main></>;
}
