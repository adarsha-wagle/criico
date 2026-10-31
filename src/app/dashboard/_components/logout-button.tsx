"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

/**
 * Pending comes from a transition, not useState: with cacheComponents, Next keeps the
 * dashboard layout's state alive after navigating away, so a `pending = true` flag would
 * still read "Logging out…" after the next login. A transition resets once the navigation lands.
 */
export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      const res = await api<null>("/api/auth/logout", { method: "POST" });
      if (res.isError) {
        toast.error(res.message);
        return;
      }
      router.replace("/auth/login");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={pending}>
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
