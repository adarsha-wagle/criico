import Link from "next/link";
import { cn } from "@/lib/utils";

/** Text wordmark in the display face. No logo shape: the name is the brand. */
export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display text-[22px] leading-none font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      Criico
    </Link>
  );
}
