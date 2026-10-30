import { TPlayerRole } from "@/lib/validation/player";
import { ROLE_FILL, ROLE_TEXT } from "./role-badge";
import { cn } from "cn";

/** Flat horizontal bars: how the squad splits across roles. Bar colour = role colour. */
export function RoleBreakdown({
  counts,
  total,
}: {
  counts: { role: TPlayerRole; count: number }[];
  total: number;
}) {
  return (
    <ul className="grid gap-4">
      {counts.map(({ role, count }) => {
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <li key={role} className="grid gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className={cn("font-medium", ROLE_TEXT[role])}>{role}</span>
              <span className="tabular-nums text-muted-foreground">
                {count} <span className="text-xs">({pct}%)</span>
              </span>
            </div>
            <div
              className="h-2 w-full bg-muted"
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
