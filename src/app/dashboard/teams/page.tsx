import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/reusables/page-header";
import { TableSkeleton } from "@/components/reusables/table-skeleton";
import { getSession } from "@/lib/jwt";
import { listTeams } from "@/lib/queries/teams";
import { EmptyState } from "@/components/reusables/empty-state";
import { TeamsTable } from "./_components/team-table";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <>
      <PageHeader
        title="Teams"
        description="Squad size and record for every team. Only finished matches count."
        action={
          <Suspense fallback={null}>
            <AddTeamButton />
          </Suspense>
        }
      />
      {/* cacheComponents: DB + cookie reads must sit inside <Suspense>. */}
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <TeamsList />
      </Suspense>
    </>
  );
}

async function AddTeamButton() {
  const session = await getSession();
  if (session?.role !== "admin") return null;
  return (
    <Link
      href="/dashboard/teams/new"
      className={cn(buttonVariants(), "w-full sm:w-auto")}
    >
      <Plus aria-hidden />
      Add team
    </Link>
  );
}

async function TeamsList() {
  const [session, teams] = await Promise.all([getSession(), listTeams()]);
  const canEdit = session?.role === "admin";

  if (teams.length === 0) {
    return (
      <EmptyState
        title="No teams yet"
        description={
          canEdit
            ? "Add a team here, or type a new team name when you record a match."
            : "Teams appear here once an admin adds them."
        }
        action={
          canEdit && (
            <Link href="/dashboard/teams/new" className={buttonVariants()}>
              Add team
            </Link>
          )
        }
      />
    );
  }

  return <TeamsTable teams={teams} canEdit={canEdit} />;
}
