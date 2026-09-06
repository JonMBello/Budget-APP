import { NextRequest, NextResponse } from "next/server";
import { getSessionStore } from "@/lib/server/session-store";
const publicPaths = new Set(["/login", "/register", "/health"]);
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const relative = path.startsWith("/app/") ? path.slice(4) : path === "/app" ? "/" : path;
  if (relative.startsWith("/_next/") || relative.startsWith("/bff/") || publicPaths.has(relative)) return NextResponse.next();
  const id = request.cookies.get("budget_session")?.value ?? "";
  if (!await getSessionStore().read(id)) {
    const login = request.nextUrl.clone(); login.pathname = "/login";
    login.search = ""; login.searchParams.set("returnTo", `/app${relative === "/" ? "" : relative}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
