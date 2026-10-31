import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/jwt";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { Brand } from "@/components/reusables/brand";
import { LeaderboardTable } from "./dashboard/leaderboard/_components/leaderboard-table";

/* The scoring rules, shown exactly as the app applies them. */
const RULES = [
  { rule: "Every run", effect: "1.2 points" },
  { rule: "Every wicket", effect: "20 points" },
  { rule: "Batsman", effect: "Runs count 1.3 times before scoring" },
  { rule: "Bowler", effect: "Wickets count 1.5 times before scoring" },
  {
    rule: "Wicketkeeper",
    effect: "30 points added, no bowling multiplier",
  },
  { rule: "Fewer than 5 matches", effect: "50 points deducted" },
  { rule: "More than 20 matches", effect: "100 points added" },
];

const container = "mx-auto w-full max-w-[1120px] px-4 md:px-6";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className={`${container} flex h-14 items-center justify-between`}>
          <Brand />
          <Suspense fallback={<div className="h-9 w-40" />}>
            <AuthLinks />
          </Suspense>
        </div>
      </header>

      <main className="flex-1">
        <section
          className={`${container} grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14`}
        >
          <div className="flex flex-col justify-center">
            <h1 className="max-w-[18ch] font-display text-[40px] leading-[1.05] font-semibold tracking-tight sm:text-5xl">
              Player records and match results for local cricket clubs
            </h1>
            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
              Admins add players and record each match. Every result updates the
              players&apos; Impact Scores, so selectors can see who is
              contributing to the side.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className={buttonVariants({ size: "lg" })}
              >
                Create account
              </Link>
              <Link
                href="/auth/login"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Log in
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-base font-semibold">Current top five</h2>
              <span className="text-[13px] text-muted-foreground">
                Updated with every recorded match
              </span>
            </div>
            <Suspense
              fallback={<Skeleton className="h-80 w-full rounded-lg" />}
            >
              <TopFive />
            </Suspense>
          </div>
        </section>

        <section className="border-t bg-card">
          <div
            className={`${container} grid gap-8 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14`}
          >
            <div>
              <h2 className="font-display text-[28px] leading-tight font-semibold tracking-tight">
                How the Impact Score works
              </h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                One number per player, built from career runs, wickets and
                matches played. The role rules are applied to runs and wickets
                before the points are added up, then the experience adjustment
                is applied to the total.
              </p>
            </div>
            <dl className="panel divide-y overflow-hidden">
              {RULES.map(({ rule, effect }) => (
                <div
                  key={rule}
                  className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="font-medium">{rule}</dt>
                  <dd className="text-muted-foreground">{effect}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className={`${container} py-6 text-sm text-muted-foreground`}>
          Criico,
        </div>
      </footer>
    </div>
  );
}

async function AuthLinks() {
  const session = await getSession();
  if (session) {
    return (
      <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
        Open dashboard
      </Link>
    );
  }
  return (
    <nav className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className={buttonVariants({ size: "sm", variant: "ghost" })}
      >
        Log in
      </Link>
      <Link href="/auth/register" className={buttonVariants({ size: "sm" })}>
        Create account
      </Link>
    </nav>
  );
}

async function TopFive() {
  const entries = await getLeaderboard({ limit: 5 });
  if (entries.length === 0) {
    return (
      <div className="panel p-6 text-sm text-muted-foreground">
        No players registered yet. The top five appears here once an admin adds
        players.
      </div>
    );
  }
  return <LeaderboardTable entries={entries} compact />;
}
