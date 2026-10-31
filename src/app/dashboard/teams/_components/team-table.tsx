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

/** Server component. Columns: squad size and the team's record. Edit only for admins. */
export function TeamsTable({
  teams,
  canEdit,
}: {
  teams: TeamSummary[];
  canEdit: boolean;
}) {
  return (
    <div className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Players
            </TableHead>
            <TableHead
              className="text-right"
              title="Matches played"
            >
              P
            </TableHead>
            <TableHead className="text-right" title="Won">
              W
            </TableHead>
            <TableHead className="text-right" title="Drawn">
              D
            </TableHead>
            <TableHead className="text-right" title="Lost">
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
                  <span className="text-[13px] text-muted-foreground sm:hidden">
                    {t.playerCount} {t.playerCount === 1 ? "player" : "players"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                {formatNumber(t.playerCount)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(t.played)}
              </TableCell>
              <TableCell className="text-right font-medium">
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
                      size: "icon-sm",
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
