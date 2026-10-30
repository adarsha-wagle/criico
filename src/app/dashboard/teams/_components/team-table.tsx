import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { TeamSummary } from "@/lib/queries/teams";
import { cn } from "@/lib/utils";

const head = "text-xs uppercase tracking-wide";

/** Server component. Columns: squad size and the team's record. Edit only for admins. */
export function TeamsTable({
  teams,
  canEdit,
}: {
  teams: TeamSummary[];
  canEdit: boolean;
}) {
  return (
    <div className="border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className={head}>Team</TableHead>
            <TableHead className={cn(head, "hidden text-right sm:table-cell")}>
              Players
            </TableHead>
            <TableHead
              className={cn(head, "text-right")}
              title="Matches played"
            >
              P
            </TableHead>
            <TableHead className={cn(head, "text-right")} title="Won">
              W
            </TableHead>
            <TableHead className={cn(head, "text-right")} title="Drawn">
              D
            </TableHead>
            <TableHead className={cn(head, "text-right")} title="Lost">
              L
            </TableHead>
            {canEdit && (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{t.name}</span>
                  {/* Squad size moves under the name on small screens. */}
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {t.playerCount} players
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                {formatNumber(t.playerCount)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(t.played)}
              </TableCell>
              <TableCell className="text-right font-semibold text-primary">
                {formatNumber(t.won)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(t.drawn)}
              </TableCell>
              <TableCell
                className={cn("text-right", t.lost > 0 && "text-destructive")}
              >
                {formatNumber(t.lost)}
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/teams/${t.id}/edit`}
                    aria-label={`Edit ${t.name}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                  >
                    <Pencil />
                  </Link>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
