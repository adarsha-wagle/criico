/**
 * Seeds teams and players from the 2025 Nepal Premier League (NPL).
 *
 *   npm run db:seed            add anything missing (safe to re-run)
 *   npm run db:seed -- --reset wipe matches, players and teams first (users are kept)
 *
 * DATA NOTES
 * - Team and player names: 2025 NPL squads (https://en.wikipedia.org/wiki/2025_Nepal_Premier_League).
 * - Roles: our best mapping of each player's usual role; the source only marks wicketkeepers.
 *   Edit any player in the app if a role is off.
 * - Base price, matches, runs and wickets are DEMO NUMBERS, not real statistics.
 *   They are generated from the player's name, so every run produces the same values.
 *
 * Builds its own Pool because src/db/index.ts imports `server-only`.
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema";
import { TPlayerRole } from "@/lib/validation/player";

type SquadPlayer = [name: string, role: TPlayerRole];

const NPL_2025: Record<string, SquadPlayer[]> = {
  "Biratnagar Kings": [
    ["Sandeep Lamichhane", "Bowler"],
    ["Lokesh Bam", "Wicketkeeper"],
    ["Pratish GC", "Bowler"],
    ["Shubham Ranjane", "All-rounder"],
    ["Surya Tamang", "Batsman"],
  ],
  "Chitwan Rhinos": [
    ["Kushal Malla", "All-rounder"],
    ["Kamal Singh Airee", "Bowler"],
    ["Dev Khanal", "Batsman"],
    ["Arjun Saud", "Wicketkeeper"],
    ["Bipin Rawal", "Wicketkeeper"],
  ],
  "Janakpur Bolts": [
    ["Wayne Parnell", "All-rounder"],
    ["Lalit Rajbanshi", "Bowler"],
    ["Anil Sah", "Wicketkeeper"],
    ["Kishore Mahato", "Bowler"],
    ["Rupesh Singh", "All-rounder"],
  ],
  "Karnali Yaks": [
    ["Sompal Kami", "All-rounder"],
    ["Gulshan Jha", "All-rounder"],
    ["Deepak Dumre", "Wicketkeeper"],
    ["Nandan Yadav", "Bowler"],
    ["Arjun Gharti", "Wicketkeeper"],
  ],
  "Kathmandu Gorkhas": [
    ["Karan KC", "Bowler"],
    ["Bhim Sharki", "Batsman"],
    ["Uttam Magar", "Wicketkeeper"],
    ["Aakash Tripathi", "Batsman"],
    ["Sonu Devkota", "All-rounder"],
  ],
  "Lumbini Lions": [
    ["Rohit Paudel", "Batsman"],
    ["Dilip Nath", "Wicketkeeper"],
    ["Sher Malla", "All-rounder"],
    ["Tilak Bhandari", "Bowler"],
    ["Bibek Yadav", "Bowler"],
  ],
  "Pokhara Avengers": [
    ["Kushal Bhurtel", "Batsman"],
    ["Arjun Kumal", "Wicketkeeper"],
    ["Sagar Dhakal", "Bowler"],
    ["Dinesh Kharel", "Batsman"],
    ["Aakash Chand", "Bowler"],
  ],
  "Sudurpaschim Royals": [
    ["Dipendra Singh Airee", "All-rounder"],
    ["Binod Bhandari", "Wicketkeeper"],
    ["Abinash Bohara", "Bowler"],
    ["Ishan Pandey", "Batsman"],
    ["Hemant Dhami", "Bowler"],
  ],
};

/* Deterministic demo stats ------------------------------------------- */

/** String → 32-bit seed (FNV-1a), then mulberry32: same name, same numbers, every run. */
function rngFor(name: string) {
  let h = 2166136261;
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (rand: () => number, min: number, max: number) =>
  min + rand() * (max - min);

/** Per-match averages by role: [runs min, runs max, wickets min, wickets max]. */
const ROLE_PROFILE: Record<TPlayerRole, [number, number, number, number]> = {
  Batsman: [20, 34, 0, 0.15],
  Wicketkeeper: [14, 27, 0, 0],
  "All-rounder": [12, 24, 0.5, 1.1],
  Bowler: [3, 8, 0.9, 1.8],
};

function demoStats(name: string, role: TPlayerRole) {
  const rand = rngFor(name);
  // 2 to 32 matches: gives a mix of rookies (<5), regulars and veterans (>20).
  const matchesPlayed = Math.round(between(rand, 2, 32));
  const [rMin, rMax, wMin, wMax] = ROLE_PROFILE[role];
  return {
    matchesPlayed,
    totalRuns: Math.round(matchesPlayed * between(rand, rMin, rMax)),
    totalWickets: Math.round(matchesPlayed * between(rand, wMin, wMax)),
    basePrice: Math.round(between(rand, 5, 50)) * 10_000, // demo value
  };
}

/* Seeding ------------------------------------------------------------ */

const reset = process.argv.includes("--reset");
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function main() {
  await db.transaction(async (tx) => {
    if (reset) {
      // Children first because of foreign keys. Users stay.
      await tx.delete(schema.matchPerformances);
      await tx.delete(schema.matches);
      await tx.delete(schema.players);
      await tx.delete(schema.teams);
      console.log("✔ Cleared matches, players and teams");
    }

    const existing = new Set(
      (await tx.select({ name: schema.players.name }).from(schema.players)).map(
        (p) => p.name,
      ),
    );
    let added = 0;

    for (const [teamName, squad] of Object.entries(NPL_2025)) {
      const [team] = await tx
        .insert(schema.teams)
        .values({ name: teamName })
        .onConflictDoUpdate({
          target: schema.teams.name,
          set: { name: teamName },
        })
        .returning({ id: schema.teams.id });

      const rows = squad
        .filter(([name]) => !existing.has(name))
        .map(([name, role]) => ({
          name,
          role,
          teamId: team.id,
          ...demoStats(name, role),
        }));

      if (rows.length) await tx.insert(schema.players).values(rows);
      added += rows.length;
      console.log(
        `✔ ${teamName}: ${rows.length} added, ${squad.length - rows.length} already present`,
      );
    }

    console.log(
      `\nDone. ${added} players added across ${Object.keys(NPL_2025).length} teams.`,
    );
  });
}

main()
  .catch((err) => {
    console.error("✘ Seed failed:", err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
