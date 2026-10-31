import Link from "next/link";
import { cn } from "@/lib/utils";
import { TPlayerRole } from "@/lib/validation/player";
import { PLAYER_ROLES } from "@/config/constant";

/**
 * Segmented control built from plain links: works without JavaScript,
 * and the filter lives in the URL so it can be shared or bookmarked.
 */
export function RoleFilter({ active }: { active?: TPlayerRole }) {
  const options: (TPlayerRole | undefined)[] = [undefined, ...PLAYER_ROLES];

  return (
    <nav aria-label="Filter by role" className="mb-4 overflow-x-auto">
      <div className="inline-flex gap-1 rounded-md border bg-card p-1">
        {options.map((role) => {
          const isActive = role === active;
          return (
            <Link
              key={role ?? "all"}
              href={role ? `?role=${encodeURIComponent(role)}` : "?"}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {role ?? "All roles"}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
