import { requireUser } from "@/lib/server/session";
import { ProfileForm, LogoutButton } from "@/features/auth/profile-form";
export default async function ProfilePage() { const user = await requireUser(); return <><p className="eyebrow">TU CUENTA</p><h1>Perfil</h1><p className="muted">Los detalles de tu espacio personal.</p><ProfileForm user={user} /><LogoutButton /></>; }
