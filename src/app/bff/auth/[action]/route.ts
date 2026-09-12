import { cookies } from "next/headers";
import { authResponseSchema, loginSchema, registerSchema } from "@/features/auth/contracts";
import { ApiError, apiRequest } from "@/lib/server/api";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { limitAuthAttempt } from "@/lib/server/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, sessionId } from "@/lib/server/session";
import { getSessionStore } from "@/lib/server/session-store";

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await context.params;
    if (!["login", "register", "logout"].includes(action)) return privateJson({ message: "No encontramos esta acción." }, 404);
    checkOrigin(request);
    const store = getSessionStore();
    if (action === "logout") {
      const id = await sessionId();
      await store.lock(id, () => store.destroy(id));
      (await cookies()).set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
      return privateJson({ success: true });
    }
    if (action === "register" && process.env.BUDGET_APP_ALLOW_REGISTRATION !== "true") throw new ApiError(403);
    const data = (action === "login" ? loginSchema : registerSchema).parse(await readJson(request));
    limitAuthAttempt(data.email);
    let result: unknown;
    try { result = await apiRequest(`/auth/${action}`, { method: "POST", body: data }); } catch (error) {
      if (error instanceof ApiError && error.status === 401) return privateJson({ message: "No pudimos iniciar sesión. Revisa tu correo y contraseña." }, 401);
      throw error;
    }
    const auth = authResponseSchema.parse(result);
    const previous = await sessionId();
    const id = await store.create(auth);
    if (previous) await store.lock(previous, () => store.destroy(previous));
    (await cookies()).set(SESSION_COOKIE, id, sessionCookieOptions());
    return privateJson({ user: auth.user });
  } catch (error) { return failure(error); }
}
