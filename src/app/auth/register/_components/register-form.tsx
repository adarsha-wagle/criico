"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField } from "@/components/reusables/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { FieldErrors } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const res = await api<{ user: { name: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
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

    toast.success("Account created");
    router.replace("/dashboard");
    router.refresh();
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
