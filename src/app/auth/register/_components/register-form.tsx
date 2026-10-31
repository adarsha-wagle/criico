"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/reusables/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { FieldErrors } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  // A transition, not a useState flag: Next keeps this page's state alive after navigating
  // away, so a flag left true would still show the pending label on the next visit.
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await api<{ user: { name: string } }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (res.isError) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }

      toast.success("Account created");
      router.replace("/dashboard");
      router.refresh();
    });
  }

  const field = (name: "name" | "email" | "password") => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="name" label="Full name" error={errors.name?.[0]}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          {...field("name")}
        />
      </FormField>
      <FormField id="email" label="Email" error={errors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          {...field("email")}
        />
      </FormField>
      <FormField
        id="password"
        label="Password"
        error={errors.password?.[0]}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          {...field("password")}
        />
      </FormField>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
