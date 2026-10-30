import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/jwt";
import { PageHeader } from "@/components/reusables/page-header";
import { idParamSchema } from "@/lib/validation/player";
import { EmptyState } from "@/components/reusables/empty-state";
import { PlayerForm } from "../../_components/player-form";

export const metadata: Metadata = { title: "Edit player" };

type Params = Promise<{ id: string }>;

export default function EditPlayerPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader
        title="Edit player"
        description="Changes update the leaderboard immediately."
      />
      <div className="max-w-2xl border bg-card p-4 sm:p-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <EditPlayer params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function EditPlayer({ params }: { params: Params }) {
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) notFound();

  const [session, player] = await Promise.all([
    getSession(),
    db.query.players.findFirst({ where: eq(players.id, id) }),
  ]);

  if (!player) notFound();
  if (session?.role !== "admin") {
    return (
      <EmptyState
        title="Admins only"
        description="Ask a club admin to give your account edit access."
      />
    );
  }

  return (
    <PlayerForm
      playerId={player.id}
      defaults={{
        name: player.name,
        role: player.role,
        basePrice: player.basePrice,
        matchesPlayed: player.matchesPlayed,
        totalRuns: player.totalRuns,
        totalWickets: player.totalWickets,
      }}
    />
  );
}
