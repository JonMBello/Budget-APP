import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authResponseSchema, userSchema, type User } from "@/features/auth/contracts";
import { ApiError, apiRequest } from "./api";
import { getSessionStore } from "./session-store";

export const SESSION_COOKIE = "budget_session";
export function sessionCookieOptions() {
  return { httpOnly: true, secure: new URL(process.env.BUDGET_APP_ORIGIN ?? "http://localhost").protocol === "https:", sameSite: "lax" as const, path: "/app", maxAge: 7 * 24 * 60 * 60 };
}
export async function sessionId() { return (await cookies()).get(SESSION_COOKIE)?.value ?? ""; }

export async function withSession<T>(id: string, operation: (token: string) => Promise<T>): Promise<T> {
  const store = getSessionStore();
  const session = await store.read(id);
  if (!session) throw new ApiError(401);
  try { return await operation(session.accessToken); } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  const token = await store.lock(id, async () => {
    const current = await store.read(id);
    if (!current) throw new ApiError(401);
    if (current.accessToken !== session.accessToken) return current.accessToken;
    try {
      const auth = authResponseSchema.parse(await apiRequest("/auth/refresh", { method: "POST", body: { refreshToken: current.refreshToken } }));
      if (auth.user.id !== current.user.id) { await store.destroy(id); throw new ApiError(401); }
      await store.save(id, { ...auth, expiresAt: current.expiresAt });
      return auth.accessToken;
    } catch (error) {
      if (error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) await store.destroy(id);
      throw error;
    }
  });
  try { return await operation(token); } catch (error) {
    if (error instanceof ApiError && error.status === 401) await store.lock(id, () => store.destroy(id));
    throw error;
  }
}

export async function authenticatedRequest<T>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}) {
  return withSession(await sessionId(), (token) => apiRequest<T>(path, { ...options, token }));
}
export async function requireUser(): Promise<User> {
  try { return userSchema.parse(await authenticatedRequest("/users/me")); } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }
}
