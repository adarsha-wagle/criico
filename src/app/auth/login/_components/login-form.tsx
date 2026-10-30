"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/reusables/form-field";
import { api } from "@/lib/api-client";
import { FieldErrors } from "@/lib/api";
import { safeRedirect } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const res = await api<{ user: { name: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (res.isError) {
      setPending(false);
      setErrors(res.errors ?? {});
      toast.error(res.message);
      return;
    }

    toast.success(`Welcome back, ${res.data.user.name}`);
    // Back to the page that sent them here, but only if it's on this site.
    router.replace(safeRedirect(searchParams.get("from")));
    router.refresh();
  }

  return (
    // noValidate: our own messages (and toasts) instead of the browser's tooltips.
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="email" label="Email" error={errors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.[0]}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
      </FormField>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
