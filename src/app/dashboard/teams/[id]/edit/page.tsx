import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/reusables/page-header";
import { idParamSchema } from "@/lib/validation/player";
import { getSession } from "@/lib/jwt";
import { getTeamById } from "@/lib/queries/teams";
import { EmptyState } from "@/components/reusables/empty-state";
import { TeamForm } from "../../_components/team-form";
import { RoleBadge } from "@/components/reusables/role-badge";

export const metadata: Metadata = { title: "Edit team" };

type Params = Promise<{ id: string }>;

export default function EditTeamPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader
        title="Edit team"
        description="Renaming updates the name everywhere, including past matches."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-xl" />}>
        <EditTeam params={params} />
      </Suspense>
    </>
  );
}

async function EditTeam({ params }: { params: Params }) {
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) notFound();

  const [session, team] = await Promise.all([getSession(), getTeamById(id)]);
  if (!team) notFound();
  if (session?.role !== "admin") {
    return (
      <EmptyState
        title="Admins only"
        description="Ask a club admin to give your account edit access."
      />
    );
  }

  return (
    <div className="grid max-w-xl gap-6">
      <div className="panel p-5 sm:p-6">
        <TeamForm teamId={team.id} defaultName={team.name} />
      </div>

      {/* Read-only: shows who is linked to this team. */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Squad</h2>
          <span className="text-[13px] text-muted-foreground">
            {team.squad.length} {team.squad.length === 1 ? "player" : "players"}
          </span>
        </div>
        {team.squad.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No players are assigned to this team.
          </p>
        ) : (
          <ul className="divide-y">
            {team.squad.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="font-medium">{p.name}</span>
                <RoleBadge role={p.role} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
