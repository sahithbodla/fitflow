"use server";

import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { burnPasswordTime, verifyPassword } from "@/lib/auth/password";
import { createSessionCookie, destroySessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import {
  errorState,
  fieldErrorsFromZod,
  type FormState,
} from "@/lib/actions/types";

/** Only allow same-origin relative paths as post-login redirects. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState(
      "Please check the details below.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const target = safeRedirectTarget(formData.get("next"));

  try {
    await connectToDatabase();
  } catch {
    return errorState(
      "Could not reach the database. Check the server configuration and try again.",
    );
  }

  const user = await User.findOne({ email: parsed.data.email })
    .select("name email passwordHash active")
    .lean();

  if (!user || !user.active) {
    await burnPasswordTime();
    return errorState("Incorrect email or password.");
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return errorState("Incorrect email or password.");
  }

  await createSessionCookie({
    userId: String(user._id),
    email: user.email,
    name: user.name,
  });

  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
