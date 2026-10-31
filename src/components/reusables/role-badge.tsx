import { cn } from "@/lib/utils";
import { TPlayerRole } from "@/lib/validation/player";

/** One fixed colour per role, used everywhere a role appears (tables, bars, forms). */
export const ROLE_TEXT: Record<TPlayerRole, string> = {
  Batsman: "text-role-batsman",
  Bowler: "text-role-bowler",
  "All-rounder": "text-role-allrounder",
  Wicketkeeper: "text-role-wicketkeeper",
};

export const ROLE_FILL: Record<TPlayerRole, string> = {
  Batsman: "bg-role-batsman",
  Bowler: "bg-role-bowler",
  "All-rounder": "bg-role-allrounder",
  Wicketkeeper: "bg-role-wicketkeeper",
};

/** Small square in the role's colour. */
export function RoleSwatch({
  role,
  className,
}: {
  role: TPlayerRole;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-[2px]", ROLE_FILL[role], className)}
    />
  );
}

/** Role name with its colour swatch. Quiet enough to sit under a player name. */
export function RoleBadge({
  role,
  className,
}: {
  role: TPlayerRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] leading-none text-muted-foreground",
        className,
      )}
    >
      <RoleSwatch role={role} />
      {role}
    </span>
  );
}
