"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/players", label: "Players" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/teams", label: "Teams" },
  { href: "/dashboard/matches", label: "Matches" },
] as const;

/** Section tabs. The active tab is underlined in green and announced as the current page. */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="h-full">
      <ul className="flex h-full items-stretch">
        {NAV.map(({ href, label, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:bg-secondary",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-t-sm",
                  active
                    ? "text-foreground after:bg-primary"
                    : "text-muted-foreground hover:text-foreground after:bg-transparent",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
