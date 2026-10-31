"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/reusables/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPlayerAction,
  updatePlayerAction,
  type PlayerFormState,
} from "../_actions/players-action";
import type { TPlayerRole } from "@/lib/validation/player";
import { PLAYER_ROLES } from "@/config/constant";
import { RoleSwatch } from "@/components/reusables/role-badge";

export interface PlayerFormValues {
  name: string;
  role: TPlayerRole;
  teamId: string | null;
  basePrice: number;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
}

const NUMBER_FIELDS = [
  { name: "basePrice", label: "Base price" },
  { name: "matchesPlayed", label: "Matches played" },
  { name: "totalRuns", label: "Total runs" },
  { name: "totalWickets", label: "Total wickets" },
] as const;

/**
 * Add and edit share one form. Submission goes through a Server Action via useActionState.
 * No `min` attribute on the number inputs on purpose: a negative value reaches the server,
 * fails Zod validation, and comes back as a toast plus an inline error.
 */
export function PlayerForm({
  playerId,
  defaults,
  teams,
}: {
  playerId?: string;
  defaults?: PlayerFormValues;
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const action = useMemo(
    () =>
      playerId ? updatePlayerAction.bind(null, playerId) : createPlayerAction,
    [playerId],
  );
  const [state, formAction, pending] = useActionState<
    PlayerFormState,
    FormData
  >(action, null);

  const [role, setRole] = useState<TPlayerRole | null>(defaults?.role ?? null);
  // Same pattern for the team; null = "No team".
  const [teamId, setTeamId] = useState<string | null>(defaults?.teamId ?? null);
  // Base UI Select shows the label for the chosen value when given `items`.
  const teamItems = useMemo(
    () => [
      { value: null, label: "No team" },
      ...teams.map((t) => ({ value: t.id, label: t.name })),
    ],
    [teams],
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      router.push("/dashboard/players");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  /**
   * React 19 resets uncontrolled inputs after every action. Feeding the submitted values
   * back in as defaultValue means a failed submit keeps what the user typed.
   */
  const valueOf = (name: (typeof NUMBER_FIELDS)[number]["name"] | "name") =>
    state && !state.ok && state.values?.[name] !== undefined
      ? state.values[name]
      : defaults
        ? String(defaults[name])
        : "";

  const a11y = (name: string) => ({
    "aria-invalid": !!errors?.[name],
    "aria-describedby": errors?.[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={formAction} noValidate className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField id="name" label="Full name" error={errors?.name?.[0]}>
            <Input
              id="name"
              name="name"
              defaultValue={valueOf("name")}
              autoComplete="off"
              {...a11y("name")}
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField id="role" label="Role" error={errors?.role?.[0]}>
            <input type="hidden" name="role" value={role ?? ""} />
            {/* Base UI calls onValueChange with string | null. Items only use PLAYER_ROLES, so the cast is safe. */}
            <Select
              value={role}
              onValueChange={(value) => setRole(value as TPlayerRole | null)}
            >
              <SelectTrigger id="role" className="w-full" {...a11y("role")}>
                <SelectValue placeholder="Choose a role" />
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
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField
            id="teamId"
            label="Team"
            error={errors?.teamId?.[0]}
            hint="Match forms only offer a team's own players."
          >
            <input type="hidden" name="teamId" value={teamId ?? ""} />
            <Select
              items={teamItems}
              value={teamId}
              onValueChange={(value) => setTeamId(value as string | null)}
            >
              <SelectTrigger id="teamId" className="w-full" {...a11y("teamId")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamItems.map((t) => (
                  <SelectItem key={t.value ?? "none"} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {NUMBER_FIELDS.map((f) => (
          <FormField
            key={f.name}
            id={f.name}
            label={f.label}
            error={errors?.[f.name]?.[0]}
          >
            <Input
              id={f.name}
              name={f.name}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={valueOf(f.name)}
              className="tabular-nums"
              {...a11y(f.name)}
            />
          </FormField>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {/* Base UI has no asChild: style the Link directly as a button. */}
        <Link
          href="/dashboard/players"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : playerId ? "Save changes" : "Add player"}
        </Button>
      </div>
    </form>
  );
}
