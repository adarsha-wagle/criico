"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const res = await api<null>("/api/auth/logout", { method: "POST" });
    if (res.isError) {
      setPending(false);
      toast.error(res.message);
      return;
    }
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      disabled={pending}
      className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <LogOut aria-hidden />
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
