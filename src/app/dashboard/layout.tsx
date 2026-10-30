import { Suspense } from "react";
import Link from "next/link";
import { UserPanel, UserPanelSkeleton } from "./_components/user-panel";
import { DashboardNav } from "./_components/dashboard-nav";
import { MobileNav } from "./_components/mobile-nav";

/**
 * Desktop (md+): fixed sidebar on the left, content on the right.
 * Mobile: green top bar with a menu button that opens the same nav in a sheet.
 * The user panel reads cookies, so it sits in <Suspense> (required by cacheComponents).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPanel = (
    <Suspense fallback={<UserPanelSkeleton />}>
      <UserPanel />
    </Suspense>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            Criico
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
        </div>
        <div className="border-t border-sidebar-border p-3">{userPanel}</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <Suspense fallback={null}>
          <MobileNav userPanel={userPanel} />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
