import { cn } from "@/lib/utils";
import { TPlayerRole } from "@/lib/validation/player";

/** One fixed colour per role, used everywhere a role appears (tables, bars, forms). */
export const ROLE_TEXT: Record<TPlayerRole, string> = {
  Batsman: "text-role-batsman border-role-batsman",
  Bowler: "text-role-bowler border-role-bowler",
  "All-rounder": "text-role-allrounder border-role-allrounder",
  Wicketkeeper: "text-role-wicketkeeper border-role-wicketkeeper",
};

export const ROLE_FILL: Record<TPlayerRole, string> = {
  Batsman: "bg-role-batsman",
  Bowler: "bg-role-bowler",
  "All-rounder": "bg-role-allrounder",
  Wicketkeeper: "bg-role-wicketkeeper",
};

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
        "inline-flex items-center border px-1.5 py-0.5 text-[11px] font-medium uppercase leading-none tracking-wide",
        ROLE_TEXT[role],
        className,
      )}
    >
      {role}
    </span>
  );
}
