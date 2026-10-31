import { Suspense } from "react";
import { Brand } from "@/components/reusables/brand";
import { UserPanel, UserPanelSkeleton } from "./_components/user-panel";
import { DashboardNav } from "./_components/dashboard-nav";

/**
 * One top bar for every screen size: brand, section tabs, and the signed-in user.
 * Below md the tabs move to their own row that scrolls sideways, so every section
 * stays one tap away without a menu.
 * The user panel reads cookies, so it sits in <Suspense> (required by cacheComponents).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-8 px-4 md:px-6">
          <Brand href="/dashboard" />
          <div className="hidden h-full md:block">
            <Suspense fallback={null}>
              <DashboardNav />
            </Suspense>
          </div>
          <div className="ml-auto">
            <Suspense fallback={<UserPanelSkeleton />}>
              <UserPanel />
            </Suspense>
          </div>
        </div>
        <div className="h-11 overflow-x-auto border-t px-1 md:hidden">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
