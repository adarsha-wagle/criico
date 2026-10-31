import { TPlayerRole } from "@/lib/validation/player";
import { cn } from "@/lib/utils";
import { ROLE_FILL, RoleBadge } from "./role-badge";

/** Horizontal bars: how the squad splits across roles. Bar colour = role colour. */
export function RoleBreakdown({
  counts,
  total,
}: {
  counts: { role: TPlayerRole; count: number }[];
  total: number;
}) {
  return (
    <ul className="grid gap-5">
      {counts.map(({ role, count }) => {
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <li key={role} className="grid gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <RoleBadge role={role} className="text-sm text-foreground" />
              <span className="tabular-nums text-muted-foreground">
                {count} <span className="text-[13px]">({pct}%)</span>
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary"
              role="progressbar"
              aria-label={`${role}s`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn("h-full", ROLE_FILL[role])}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
