import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/reusables/page-header";
import { TeamForm } from "../_components/team-form";
import { getSession } from "@/lib/jwt";
import { EmptyState } from "@/components/reusables/empty-state";

export const metadata: Metadata = { title: "Add team" };

export default function NewTeamPage() {
  return (
    <>
      <PageHeader
        title="Add team"
        description="Name the team and, optionally, add its squad."
      />
      <div className="panel max-w-2xl p-5 sm:p-6">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <AdminOnly>
            <TeamForm />
          </AdminOnly>
        </Suspense>
      </div>
    </>
  );
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
