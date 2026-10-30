import Link from "next/link";
import { cn } from "@/lib/utils";

/** Text wordmark. No logo shape: the name is the brand. */
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
      className={cn("text-lg font-semibold tracking-tight", className)}
    >
      Criico
    </Link>
  );
}
