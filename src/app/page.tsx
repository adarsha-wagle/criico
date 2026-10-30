import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
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
    effect: "Flat 30 point bonus, no bowling multiplier",
  },
  { rule: "Fewer than 5 matches", effect: "50 points deducted" },
  { rule: "More than 20 matches", effect: "100 points added" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Brand />
          <Suspense fallback={<div className="h-9 w-40" />}>
            <AuthLinks />
          </Suspense>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:py-16">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                For local cricket clubs
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Player records, match results and one score that ranks them all.
              </h1>
              <p className="mt-4 max-w-prose text-muted-foreground">
                Club admins add players and record each match. Every result
                updates the player&apos;s Impact Score, so selectors can see at
                a glance who is contributing to the side.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg">
                  <Link href="/auth/register">Create an account</Link>
                </Button>
                <Button size="lg" variant="outline">
                  <Link href="/auth/login">Log in</Link>
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-semibold">Current top five</h2>
                <span className="text-xs text-muted-foreground">
                  Live from the club register
                </span>
              </div>
              <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                <TopFive />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight">
            How the Impact Score is calculated
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            The same rules apply to every player. Role multipliers apply to the
            raw stat before it is scored.
          </p>
          <dl className="mt-6 grid border bg-card sm:grid-cols-2">
            {RULES.map(({ rule, effect }) => (
              <div
                key={rule}
                className="flex flex-col gap-1 border-b p-4 sm:odd:border-r"
              >
                <dt className="text-sm font-semibold">{rule}</dt>
                <dd className="text-sm text-muted-foreground">{effect}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          Criico. Built for the Criico full stack assessment.
        </div>
      </footer>
    </div>
  );
}

async function AuthLinks() {
  const session = await getSession();
  if (session) {
    return (
      <Button size="sm">
        <Link href="/dashboard">Open dashboard</Link>
      </Button>
    );
  }
  return (
    <nav className="flex items-center gap-2">
      <Button size="sm" variant="ghost">
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button size="sm">
        <Link href="/auth/register">Register</Link>
      </Button>
    </nav>
  );
}

async function TopFive() {
  const entries = await getLeaderboard({ limit: 5 });
  if (entries.length === 0) {
    return (
      <div className="border bg-card p-6 text-sm text-muted-foreground">
        No players registered yet. The top five appears here once an admin adds
        players.
      </div>
    );
  }
  return <LeaderboardTable entries={entries} compact />;
}
