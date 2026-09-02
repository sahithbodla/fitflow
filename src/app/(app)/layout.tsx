import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileTopbar } from "@/components/layout/mobile-topbar";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Server-side authorization. The proxy is only a fast first gate.
  const user = await requireUser();
  const brand = await getBrandSettings();

  return (
    <div className="flex min-h-dvh">
      <SidebarNav brand={brand} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopbar brand={brand} />
        <main className="flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-10 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav user={user} />
    </div>
  );
}
