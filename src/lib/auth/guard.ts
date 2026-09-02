import "server-only";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { readSession, type SessionPayload } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Resolves the session and re-checks the user against the database, so a
 * deactivated or deleted account cannot keep using an unexpired token.
 * Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session: SessionPayload | null = await readSession();
  if (!session) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId)
      .select("name email active")
      .lean();
    if (!user || !user.active) return null;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}

/** For server components/pages: redirects to login when unauthenticated. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo
      ? `/login?next=${encodeURIComponent(returnTo)}`
      : "/login";
    redirect(target);
  }
  return user;
}

/** For route handlers / server actions: throws instead of redirecting. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUserOrThrow(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
