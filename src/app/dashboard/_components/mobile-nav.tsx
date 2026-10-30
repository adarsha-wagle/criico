"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DashboardNav } from "./dashboard-nav";

/**
 * Top bar + slide-in menu below the md breakpoint.
 * `userPanel` is a server-rendered slot (name, role, log out) passed in from the layout.
 */
export function MobileNav({ userPanel }: { userPanel: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* Base UI: the trigger renders our Button via the `render` prop (no asChild). */}
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            />
          }
        >
          <Menu />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-72 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-4">
            <SheetTitle className="text-left text-lg font-semibold tracking-tight text-sidebar-foreground">
              Criico
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 p-3">
            {/* Close the sheet when a link is chosen. */}
            <DashboardNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-sidebar-border p-3">{userPanel}</div>
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Criico
      </Link>
    </div>
  );
}
