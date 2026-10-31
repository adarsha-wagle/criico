import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { players } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/jwt";
import { calculateImpactScore } from "@/lib/impact-score";
import { PageHeader } from "@/components/reusables/page-header";
import { TableSkeleton } from "@/components/reusables/table-skeleton";
import { EmptyState } from "@/components/reusables/empty-state";
import { PlayersTable } from "./_components/players-table";

export const metadata: Metadata = { title: "Players" };

export default function PlayersPage() {
  return (
    <>
      <PageHeader
        title="Players"
        description="Everyone on the club register with their career totals."
        action={
          <Suspense fallback={null}>
            <AddPlayerButton />
          </Suspense>
        }
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <PlayersList />
      </Suspense>
    </>
  );
}

async function AddPlayerButton() {
  const session = await getSession();
  if (session?.role !== "admin") return null;
  return (
    <Link
      href="/dashboard/players/new"
      className={cn(buttonVariants(), "w-full sm:w-auto")}
    >
      <Plus aria-hidden />
      Add player
    </Link>
  );
}

async function PlayersList() {
  await connection();
  const [session, rows] = await Promise.all([
    getSession(),
    db.select().from(players).orderBy(asc(players.name)),
  ]);
  const canEdit = session?.role === "admin";

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No players yet"
        description={
          canEdit
            ? "Add the first player to the register."
            : "An admin has not added any players yet."
        }
        action={
          canEdit && (
            <Link href="/dashboard/players/new" className={buttonVariants()}>
              Add player
            </Link>
          )
        }
      />
    );
  }

  return (
    <PlayersTable
      canEdit={canEdit}
      players={rows.map((p) => ({ ...p, impact: calculateImpactScore(p) }))}
    />
  );
}
