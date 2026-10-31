"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/reusables/form-field";
import { api } from "@/lib/api-client";
import { TPlayerRole } from "@/lib/validation/player";
import { TMatchResult, TTeamSide } from "@/lib/validation/matches";
import { FieldErrors } from "@/lib/api";
import { RoleBadge } from "@/components/reusables/role-badge";

export interface MatchFormPlayer {
  id: string;
  name: string;
  role: TPlayerRole;
}

interface Row {
  key: string;
  playerId: string | null;
  runs: string;
  wickets: string;
}

/** Keys are plain counters (not random ids) so server and client render identical HTML. */
const newRow = (key: string): Row => ({
  key,
  playerId: null,
  runs: "0",
  wickets: "0",
});

/** A saved match, used to prefill the form on the edit page. */
export interface MatchFormDefaults {
  teamA: string;
  teamB: string;
  result: TMatchResult | null;
  playedAt: string; // YYYY-MM-DD
  performances: {
    playerId: string;
    team: TTeamSide;
    runs: number;
    wickets: number;
  }[];
}

/** Turns saved performances into editable rows; each side keeps at least one (empty) row. */
function initialRows(defaults?: MatchFormDefaults): Record<TTeamSide, Row[]> {
  const rowsFor = (side: TTeamSide) => {
    const rows = (defaults?.performances ?? [])
      .filter((p) => p.team === side)
      .map((p, i) => ({
        key: `${side}${i}`,
        playerId: p.playerId,
        runs: String(p.runs),
        wickets: String(p.wickets),
      }));
    return rows.length ? rows : [newRow(`${side}0`)];
  };
  return { A: rowsFor("A"), B: rowsFor("B") };
}

/**
 * Records a match (POST /api/matches) or, with `matchId`, edits one (PATCH /api/matches/[id]).
 * JSON rather than a Server Action because the performance rows are dynamic.
 * Controlled inputs throughout, so nothing is lost when the server rejects a submission.
 * No `min` on runs/wickets: negative values are rejected by the server and shown as a toast.
 */
export function MatchForm({
  players,
  teamNames,
  matchId,
  defaults,
}: {
  players: MatchFormPlayer[];
  teamNames: string[];
  matchId?: string;
  defaults?: MatchFormDefaults;
}) {
  const router = useRouter();
  const isEdit = Boolean(matchId);
  const [teamA, setTeamA] = useState(defaults?.teamA ?? "");
  const [teamB, setTeamB] = useState(defaults?.teamB ?? "");
  const [playedAt, setPlayedAt] = useState(defaults?.playedAt ?? ""); // empty = the server uses today
  // No default for a new match: an admin must pick the result, so a forgotten field can't become a draw.
  const [result, setResult] = useState<TMatchResult | null>(
    defaults?.result ?? null,
  );
  const [rows, setRows] = useState<Record<TTeamSide, Row[]>>(() =>
    initialRows(defaults),
  );
  // Next key number must be past every prefilled row, so keys never collide.
  const nextKey = useRef(Math.max(rows.A.length, rows.B.length));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  // Base UI Select shows the label for the chosen value when given `items`.
  const playerItems = useMemo(
    () => players.map((p) => ({ value: p.id, label: p.name })),
    [players],
  );
  const chosen = new Set(
    [...rows.A, ...rows.B].map((r) => r.playerId).filter(Boolean),
  );

  const nameA = teamA.trim() || "Team A";
  const nameB = teamB.trim() || "Team B";
  const resultItems = [
    { value: "A", label: `${nameA} won` },
    { value: "B", label: `${nameB} won` },
    { value: "draw", label: "Draw" },
  ];

  const updateRow = (side: TTeamSide, key: string, patch: Partial<Row>) =>
    setRows((r) => ({
      ...r,
      [side]: r[side].map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      ),
    }));
  const addRow = (side: TTeamSide) => {
    const key = `${side}${nextKey.current++}`;
    setRows((r) => ({ ...r, [side]: [...r[side], newRow(key)] }));
  };
  const removeRow = (side: TTeamSide, key: string) =>
    setRows((r) => ({
      ...r,
      [side]: r[side].filter((row) => row.key !== key),
    }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if ([...rows.A, ...rows.B].some((r) => !r.playerId)) {
      toast.error("Choose a player in every row, or remove the empty row.");
      return;
    }

    setPending(true);
    setErrors({});
    const res = await api<{ match: { id: string } }>(
      isEdit ? `/api/matches/${matchId}` : "/api/matches",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          teamA,
          teamB,
          result,
          playedAt: playedAt || undefined,
          performances: (["A", "B"] as const).flatMap((side) =>
            rows[side].map((r) => ({
              playerId: r.playerId,
              team: side,
              runs: r.runs,
              wickets: r.wickets,
            })),
          ),
        }),
      },
    );
    setPending(false);

    if (res.isError) {
      setErrors(res.errors ?? {});
      toast.error(res.message);
      return;
    }

    toast.success(
      isEdit
        ? "Match updated. Player totals recalculated."
        : "Match recorded. Player totals updated.",
    );
    // Dashboard pages are dynamic, so push() fetches fresh data. No refresh(): it can cancel the push.
    router.push(`/dashboard/matches/${res.data.match.id}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      {/* Fixture ---------------------------------------------------- */}
      <section className="panel overflow-hidden">
        <h2 className="border-b px-4 py-3 text-base font-semibold sm:px-6">Fixture</h2>
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
          <FormField id="teamA" label="Team A" error={errors.teamA?.[0]}>
            <Input
              id="teamA"
              list="team-options"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              aria-invalid={!!errors.teamA}
            />
          </FormField>
          <FormField id="teamB" label="Team B" error={errors.teamB?.[0]}>
            <Input
              id="teamB"
              list="team-options"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              aria-invalid={!!errors.teamB}
            />
          </FormField>
          <datalist id="team-options">
            {teamNames.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <FormField
            id="playedAt"
            label="Date played"
            error={errors.playedAt?.[0]}
          >
            <Input
              id="playedAt"
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </FormField>
          <FormField id="result" label="Result" error={errors.result?.[0]}>
            <Select
              items={resultItems}
              value={result}
              onValueChange={(v) => setResult(v as TMatchResult | null)}
            >
              <SelectTrigger
                id="result"
                className="w-full"
                aria-invalid={!!errors.result}
              >
                <SelectValue placeholder="Choose result" />
              </SelectTrigger>
              <SelectContent>
                {resultItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </section>

      {/* Performances ------------------------------------------------ */}
      <section className="grid gap-4">
        <div>
          <h2 className="text-base font-semibold">Player performances</h2>
          <p className="text-sm text-muted-foreground">
            Runs and wickets in this match. Each is added to the player&apos;s
            career totals, and their matches played goes up by one.
          </p>
          {errors.performances?.[0] && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {errors.performances[0]}
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {(["A", "B"] as const).map((side) => (
            <div key={side} className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold">
                  {side === "A" ? nameA : nameB}
                </h3>
                <span className="text-[13px] text-muted-foreground">
                  {rows[side].length} {rows[side].length === 1 ? "player" : "players"}
                </span>
              </div>

              <div className="hidden grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_2.25rem] gap-2 border-b bg-muted px-4 py-2 text-[13px] font-medium text-muted-foreground sm:grid">
                <span>Player</span>
                <span>Runs</span>
                <span>Wickets</span>
                <span className="sr-only">Remove</span>
              </div>

              <ul className="divide-y">
                {rows[side].map((row, i) => {
                  const idBase = `${side}-${row.key}`;
                  return (
                    <li
                      key={row.key}
                      className="grid grid-cols-[1fr_1fr_2.25rem] gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_2.25rem] sm:items-center"
                    >
                      <div className="col-span-3 sm:col-span-1">
                        <label htmlFor={`${idBase}-player`} className="sr-only">
                          Player {i + 1}
                        </label>
                        <Select
                          items={playerItems}
                          value={row.playerId}
                          onValueChange={(v) =>
                            updateRow(side, row.key, {
                              playerId: (v as string | null) ?? null,
                            })
                          }
                        >
                          <SelectTrigger
                            id={`${idBase}-player`}
                            className="w-full"
                          >
                            <SelectValue placeholder="Choose player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players
                              // A player can't be picked twice, on either team.
                              .filter(
                                (p) =>
                                  p.id === row.playerId || !chosen.has(p.id),
                              )
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <span className="flex items-center gap-2">
                                    {p.name}
                                    <RoleBadge role={p.role} />
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label
                          htmlFor={`${idBase}-runs`}
                          className="mb-1.5 block text-[13px] text-muted-foreground sm:sr-only"
                        >
                          Runs
                        </label>
                        <Input
                          id={`${idBase}-runs`}
                          type="number"
                          inputMode="numeric"
                          step={1}
                          value={row.runs}
                          onChange={(e) =>
                            updateRow(side, row.key, { runs: e.target.value })
                          }
                          className="tabular-nums"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`${idBase}-wkts`}
                          className="mb-1.5 block text-[13px] text-muted-foreground sm:sr-only"
                        >
                          Wickets
                        </label>
                        <Input
                          id={`${idBase}-wkts`}
                          type="number"
                          inputMode="numeric"
                          step={1}
                          value={row.wickets}
                          onChange={(e) =>
                            updateRow(side, row.key, {
                              wickets: e.target.value,
                            })
                          }
                          className="tabular-nums"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(side, row.key)}
                        disabled={rows[side].length === 1}
                        aria-label={`Remove player ${i + 1}`}
                        className="self-end sm:self-auto"
                      >
                        <X />
                      </Button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRow(side)}
                  disabled={chosen.size >= players.length}
                  className="w-full"
                >
                  <Plus aria-hidden />
                  Add player
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Link
          href={isEdit ? `/dashboard/matches/${matchId}` : "/dashboard/matches"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Record match"}
        </Button>
      </div>
    </form>
  );
}
