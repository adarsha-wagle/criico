import { cn } from "@/lib/utils";

/** A row of stats sharing one panel, split by 1px lines (2 columns on mobile, 4 on desktop). */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
      {children}
    </div>
  );
}

/** One number with a label. Use inside <StatGrid>. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "negative";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card p-4 sm:p-5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate font-display text-[28px] leading-tight font-semibold tabular-nums sm:text-[32px]",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="truncate text-[13px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
