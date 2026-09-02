import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { ProfileForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My account"
        description="Your sign-in details for this workspace."
      />

      <ProfileForm user={user} />
      <PasswordForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>
            Signing out clears your session on this device only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="text-destructive hover:text-destructive w-full sm:w-auto"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
