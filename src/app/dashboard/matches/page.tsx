import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { listMatches } from "@/lib/queries/matches";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/reusables/page-header";
import { TableSkeleton } from "@/components/reusables/table-skeleton";
import { getSession } from "@/lib/jwt";
import { EmptyState } from "@/components/reusables/empty-state";
import { MatchesTable } from "./_components/matches-table";

export const metadata: Metadata = { title: "Matches" };

export default function MatchesPage() {
  return (
    <>
      <PageHeader
        title="Matches"
        description="Every recorded result, newest first. The winning team is in bold."
        action={
          <Suspense fallback={null}>
            <RecordMatchButton />
          </Suspense>
        }
      />
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <MatchesList />
      </Suspense>
    </>
  );
}

async function RecordMatchButton() {
  const session = await getSession();
  if (session?.role !== "admin") return null;
  return (
    <Link
      href="/dashboard/matches/new"
      className={cn(buttonVariants(), "w-full sm:w-auto")}
    >
      <Plus aria-hidden />
      Record match
    </Link>
  );
}

async function MatchesList() {
  const [session, matches] = await Promise.all([getSession(), listMatches()]);

  if (matches.length === 0) {
    const isAdmin = session?.role === "admin";
    return (
      <EmptyState
        title="No matches recorded"
        description={
          isAdmin
            ? "Record a result to add runs and wickets to each player's totals."
            : "Results appear here once an admin records them."
        }
        action={
          isAdmin && (
            <Link href="/dashboard/matches/new" className={buttonVariants()}>
              Record match
            </Link>
          )
        }
      />
    );
  }

  return <MatchesTable matches={matches} />;
}
