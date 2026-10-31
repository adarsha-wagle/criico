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
import { formatNumber, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TPlayerRole } from "@/lib/validation/player";
import { RoleBadge } from "@/components/reusables/role-badge";

export interface PlayerRow {
  id: string;
  name: string;
  role: TPlayerRole;
  /** null when the player isn't assigned to a team. */
  team: string | null;
  basePrice: number;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  impact: number;
}

/** Server component. Edit buttons only render for admins. */
export function PlayersTable({
  players,
  canEdit,
}: {
  players: PlayerRow[];
  canEdit: boolean;
}) {
  return (
    <div className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="hidden lg:table-cell">Team</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Base price
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Matches
            </TableHead>
            <TableHead className="text-right">Runs</TableHead>
            <TableHead className="text-right">Wickets</TableHead>
            <TableHead className="text-right">Impact</TableHead>
            {canEdit && (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium">{p.name}</span>
                  {/* Team moves under the name below lg, where its column is hidden. */}
                  <span className="text-[13px] text-muted-foreground lg:hidden">
                    {p.team ?? "No team"}
                  </span>
                  <RoleBadge role={p.role} className="w-fit" />
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  "hidden lg:table-cell",
                  !p.team && "text-muted-foreground",
                )}
              >
                {p.team ?? "No team"}
              </TableCell>
              <TableCell className="hidden text-right md:table-cell">
                {formatNumber(p.basePrice)}
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                {formatNumber(p.matchesPlayed)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(p.totalRuns)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(p.totalWickets)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-display text-lg font-semibold",
                  p.impact < 0 && "text-destructive",
                )}
              >
                {formatScore(p.impact)}
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/players/${p.id}/edit`}
                    aria-label={`Edit ${p.name}`}
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
