import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge-of-app route protection.
 *
 * This is a fast first gate only: it checks that a well-formed, unexpired
 * session cookie is present. Every protected page and server action still calls
 * `requireUser()` / `requireUserOrThrow()`, which re-validates the user against
 * the database. Never treat this file as the only authorization check.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/people",
  "/members",
  "/memberships",
  "/plans",
  "/payments",
  "/coaching",
  "/exercises",
  "/workouts",
  "/diet",
  "/check-ins",
  "/settings",
  "/account",
];

const SESSION_COOKIE = "fitflow_session";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: "fitflow",
      audience: "fitflow-app",
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (isProtected(pathname)) {
    if (await hasValidSession(token)) return NextResponse.next();

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Signed-in users have no reason to see the login screen.
  if (pathname === "/login" && (await hasValidSession(token))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
