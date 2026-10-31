// src/app/dashboard/matches/new/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { EmptyState } from "@/components/reusables/empty-state";
import { PageHeader } from "@/components/reusables/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/jwt";
import { listTeamNames } from "@/lib/queries/matches";
import { MatchForm } from "../_components/match-form";

export const metadata: Metadata = { title: "Record match" };

export default function NewMatchPage() {
  return (
    <>
      <PageHeader
        title="Record match"
        description="Enter both teams, the result and what each player scored."
      />
      {/* cacheComponents: cookie + DB reads must sit inside <Suspense>. */}
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-lg" />}>
        <MatchFormLoader />
      </Suspense>
    </>
  );
}

async function MatchFormLoader() {
  const session = await getSession();
  if (session?.role !== "admin") {
    return (
      <EmptyState
        title="Admins only"
        description="Ask a club admin to give your account edit access."
      />
    );
  }

  const [roster, teamNames] = await Promise.all([
    db
      .select({ id: players.id, name: players.name, role: players.role })
      .from(players)
      .orderBy(asc(players.name)),
    listTeamNames(),
  ]);

  if (roster.length < 2) {
    return (
      <EmptyState
        title="Not enough players"
        description="A match needs at least one player on each side. Add players first."
        action={
          <Link href="/dashboard/players/new" className={buttonVariants()}>
            Add player
          </Link>
        }
      />
    );
  }

  // No matchId / defaults → empty form that POSTs a new match.
  return <MatchForm players={roster} teamNames={teamNames} />;
}
