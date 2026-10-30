import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/reusables/page-header";
import { idParamSchema } from "@/lib/validation/player";
import { EmptyState } from "@/components/reusables/empty-state";
import { getSession } from "@/lib/jwt";
import { getMatchFormValues, listTeamNames } from "@/lib/queries/matches";
import { MatchForm } from "../../_components/match-form";

export const metadata: Metadata = { title: "Edit match" };

type Params = Promise<{ id: string }>;

export default function EditMatchPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader
        title="Edit match"
        description="Saving removes this match's old runs and wickets from player totals and adds the new ones."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <EditMatchLoader params={params} />
      </Suspense>
    </>
  );
}

async function EditMatchLoader({ params }: { params: Params }) {
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) notFound();

  const session = await getSession();
  if (session?.role !== "admin") {
    return (
      <EmptyState
        title="Admins only"
        description="Ask a club admin to give your account edit access."
      />
    );
  }

  const [defaults, roster, teamNames] = await Promise.all([
    getMatchFormValues(id),
    db
      .select({ id: players.id, name: players.name, role: players.role })
      .from(players)
      .orderBy(asc(players.name)),
    listTeamNames(),
  ]);
  if (!defaults) notFound();

  return (
    <MatchForm
      matchId={id}
      defaults={defaults}
      players={roster}
      teamNames={teamNames}
    />
  );
}
