"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/reusables/form-field";
import { RoleSwatch } from "@/components/reusables/role-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_ROLES } from "@/config/constant";
import type { TPlayerRole } from "@/lib/validation/player";
import { MAX_SQUAD_SIZE } from "@/lib/validation/teams";
import {
  createTeamAction,
  updateTeamAction,
  type TeamFormState,
} from "../_actions/teams-action";

interface SquadRow {
  key: string;
  name: string;
  role: TPlayerRole | null;
}

/** Keys are plain counters (not random ids) so server and client render identical HTML. */
const newRow = (key: string): SquadRow => ({ key, name: "", role: null });

/** The server skips blank rows, so its row numbers count only the filled-in ones. */
const isFilled = (r: SquadRow) => Boolean(r.name.trim() || r.role);

export function TeamForm({
  teamId,
  defaultName,
}: {
  teamId?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(teamId);
  const action = useMemo(
    () => (teamId ? updateTeamAction.bind(null, teamId) : createTeamAction),
    [teamId],
  );
  const [state, formAction, pending] = useActionState<TeamFormState, FormData>(
    action,
    null,
  );
  const [squad, setSquad] = useState<SquadRow[]>(() => [newRow("0")]);
  const nextKey = useRef(1);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      router.push("/dashboard/teams");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const error = errors?.name?.[0];
  const value =
    state && !state.ok && state.values?.name !== undefined
      ? state.values.name
      : (defaultName ?? "");

  const updateRow = (key: string, patch: Partial<SquadRow>) =>
    setSquad((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  const addRow = () =>
    setSquad((rows) => [...rows, newRow(String(nextKey.current++))]);
  const removeRow = (key: string) =>
    setSquad((rows) => rows.filter((r) => r.key !== key));

  const filledKeys = squad.filter(isFilled).map((r) => r.key);

  return (
    <form action={formAction} noValidate className="grid gap-6">
      <FormField
        id="name"
        label="Team name"
        error={error}
        hint="Must be unique. Matches use this name."
      >
        <Input
          id="name"
          name="name"
          defaultValue={value}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "name-error" : undefined}
        />
      </FormField>

      {!isEdit && (
        <section className="grid gap-3">
          <div>
            <h2 className="text-base font-semibold">Squad</h2>
            <p className="text-sm text-muted-foreground">
              Optional. Players start with zero stats and can be edited later.
              Blank rows are ignored.
            </p>
            {errors?.players?.[0] && (
              <p className="mt-2 text-sm font-medium text-destructive">
                {errors.players[0]}
              </p>
            )}
          </div>

          <ul className="grid gap-3">
            {squad.map((row, i) => {
              const n = filledKeys.indexOf(row.key);
              const rowErrors = {
                name: n >= 0 ? errors?.[`players.${n}.name`]?.[0] : undefined,
                role: n >= 0 ? errors?.[`players.${n}.role`]?.[0] : undefined,
              };
              const idBase = `player-${row.key}`;
              return (
                <li
                  key={row.key}
                  className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_2.25rem] sm:items-start"
                >
                  <div className="grid gap-1.5">
                    <label htmlFor={`${idBase}-name`} className="sr-only">
                      Player {i + 1} name
                    </label>
                    <Input
                      id={`${idBase}-name`}
                      name="playerName"
                      placeholder="Player name"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.key, { name: e.target.value })
                      }
                      autoComplete="off"
                      aria-invalid={!!rowErrors.name}
                    />
                    {rowErrors.name && (
                      <p className="text-[13px] text-destructive">
                        {rowErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="col-start-1 row-start-2 grid gap-1.5 sm:col-start-auto sm:row-start-auto">
                    <input
                      type="hidden"
                      name="playerRole"
                      value={row.role ?? ""}
                    />
                    <Select
                      value={row.role}
                      onValueChange={(v) =>
                        updateRow(row.key, { role: v as TPlayerRole | null })
                      }
                    >
                      <SelectTrigger
                        id={`${idBase}-role`}
                        className="w-full"
                        aria-label={`Player ${i + 1} role`}
                        aria-invalid={!!rowErrors.role}
                      >
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            <span className="flex items-center gap-2">
                              <RoleSwatch role={r} />
                              {r}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rowErrors.role && (
                      <p className="text-[13px] text-destructive">
                        {rowErrors.role}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.key)}
                    disabled={squad.length === 1}
                    aria-label={`Remove player ${i + 1}`}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={squad.length >= MAX_SQUAD_SIZE}
            className="w-full sm:w-auto sm:justify-self-start"
          >
            <Plus aria-hidden />
            Add player
          </Button>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/teams"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add team"}
        </Button>
      </div>
    </form>
  );
}
