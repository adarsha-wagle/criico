import { getSession } from "@/lib/jwt";
import { LogoutButton } from "./logout-button";
import { getUserById } from "@/lib/queries/user";

/** Server component: who is logged in, their role, and log out. */
export async function UserPanel() {
  const session = await getSession();
  if (!session) return null; // middleware already redirects; this is a safety net

  const user = await getUserById(session.userId);

  return (
    <div className="grid gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {user?.name ?? "Unknown user"}
        </p>
        <p className="truncate text-xs opacity-80">{user?.email}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">
          {session.role === "admin" ? "Admin: can edit" : "Viewer: read only"}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}

export function UserPanelSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true">
      <div className="h-4 w-32 bg-sidebar-accent" />
      <div className="h-3 w-40 bg-sidebar-accent" />
      <div className="h-8 w-full bg-sidebar-accent" />
    </div>
  );
}
