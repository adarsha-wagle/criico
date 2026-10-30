"use client";

import { useActionState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/reusables/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTeamAction,
  updateTeamAction,
  type TeamFormState,
} from "../_actions/teams-action";

/**
 * Add and edit share one form, submitted through a Server Action (useActionState).
 * The submitted name is echoed back on failure so React 19's form reset doesn't wipe it.
 */
export function TeamForm({
  teamId,
  defaultName,
}: {
  teamId?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const action = useMemo(
    () => (teamId ? updateTeamAction.bind(null, teamId) : createTeamAction),
    [teamId],
  );
  const [state, formAction, pending] = useActionState<TeamFormState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      router.push("/dashboard/teams");
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const error = state && !state.ok ? state.fieldErrors?.name?.[0] : undefined;
  const value =
    state && !state.ok && state.values?.name !== undefined
      ? state.values.name
      : (defaultName ?? "");

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

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/teams"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : teamId ? "Save changes" : "Add team"}
        </Button>
      </div>
    </form>
  );
}
