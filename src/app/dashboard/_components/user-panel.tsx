import { getSession } from "@/lib/jwt";
import { getUserById } from "@/lib/queries/user";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "./logout-button";

/** Server component: who is logged in, what they can do, and log out. */
export async function UserPanel() {
  const session = await getSession();
  if (!session) return null; // middleware already redirects; this is a safety net

  const user = await getUserById(session.userId);

  return (
    <div className="flex items-center gap-4">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm leading-tight font-medium">
          {user?.name ?? "Unknown user"}
        </p>
        <p className="truncate text-[13px] leading-tight text-muted-foreground">
          {session.role === "admin" ? "Admin" : "Viewer, read only"}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}

export function UserPanelSkeleton() {
  return (
    <div className="flex items-center gap-4" aria-busy="true">
      <div className="hidden gap-1.5 sm:grid">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
