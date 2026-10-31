import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/jwt";
import { listTeamOptions } from "@/lib/queries/teams";
import { PlayerForm } from "../_components/player-form";
import { PageHeader } from "@/components/reusables/page-header";
import { EmptyState } from "@/components/reusables/empty-state";

export const metadata: Metadata = { title: "Add player" };

export default function NewPlayerPage() {
  return (
    <>
      <PageHeader
        title="Add player"
        description="Career totals so far. Match results will add to them later."
      />
      <div className="panel max-w-2xl p-5 sm:p-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <AdminOnly>
            <NewPlayerForm />
          </AdminOnly>
        </Suspense>
      </div>
    </>
  );
}

async function NewPlayerForm() {
  const teams = await listTeamOptions();
  return <PlayerForm teams={teams} />;
}

/** Viewers who open this URL directly see why they can't use it. The action re-checks too. */
async function AdminOnly({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return (
      <EmptyState
        title="Admins only"
        description="Ask a club admin to give your account edit access."
      />
    );
  }
  return <>{children}</>;
}
