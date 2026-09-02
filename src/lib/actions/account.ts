"use server";

import { revalidatePath } from "next/cache";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validation/account";
import {
  errorState,
  fieldErrorsFromZod,
  successState,
  type FormState,
} from "@/lib/actions/types";
import { createSessionCookie } from "@/lib/auth/session";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let current;
  try {
    current = await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorState("Your session expired. Please sign in again.");
    }
    throw error;
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    // Email is the login identifier, so it must stay unique.
    if (parsed.data.email !== current.email) {
      const taken = await User.findOne({
        email: parsed.data.email,
        _id: { $ne: current.id },
      })
        .select("_id")
        .lean();
      if (taken) {
        return errorState("Please fix the highlighted fields.", {
          email: "That email is already in use.",
        });
      }
    }

    await User.updateOne(
      { _id: current.id },
      { $set: { name: parsed.data.name, email: parsed.data.email } },
    );

    // Keep the session cookie in step with the new name/email.
    await createSessionCookie({
      userId: current.id,
      email: parsed.data.email,
      name: parsed.data.name,
    });
  } catch {
    return errorState("Could not save your details. Please try again.");
  }

  revalidatePath("/", "layout");
  return successState("Your details were updated.");
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let current;
  try {
    current = await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorState("Your session expired. Please sign in again.");
    }
    throw error;
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    const user = await User.findById(current.id).select("passwordHash");
    if (!user) {
      return errorState("Your account could not be found.");
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      return errorState("Please fix the highlighted fields.", {
        currentPassword: "That is not your current password.",
      });
    }

    user.set("passwordHash", await hashPassword(parsed.data.newPassword));
    await user.save();
  } catch {
    return errorState("Could not change your password. Please try again.");
  }

  return successState("Your password was changed.");
}
