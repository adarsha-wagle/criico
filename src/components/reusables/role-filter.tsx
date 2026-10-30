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
      <div className="inline-flex border bg-card">
        {options.map((role) => {
          const isActive = role === active;
          return (
            <Link
              key={role ?? "all"}
              href={role ? `?role=${encodeURIComponent(role)}` : "?"}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-r px-3 py-2 text-sm font-medium last:border-r-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground",
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
