import { type TRoleRules } from "@/lib/types";

export const PLAYER_ROLES = [
  "Batsman",
  "Bowler",
  "All-rounder",
  "Wicketkeeper",
] as const;

export const USER_ROLES = ["admin", "viewer"] as const;

export const RUN_WEIGHT = 1.2;
export const WICKET_WEIGHT = 20;
export const ROOKIE_MATCH_LIMIT = 5; // fewer than this -> penalty
export const VETERAN_MATCH_LIMIT = 20; // more than this -> bonus
export const ROOKIE_PENALTY = -50;
export const VETERAN_BONUS = 100;

export const ROLE_RULES = {
  Batsman: { runMultiplier: 1.3, wicketMultiplier: 1, flatBonus: 0 },
  Bowler: { runMultiplier: 1, wicketMultiplier: 1.5, flatBonus: 0 },
  "All-rounder": { runMultiplier: 1, wicketMultiplier: 1, flatBonus: 0 },
  Wicketkeeper: { runMultiplier: 1, wicketMultiplier: 1, flatBonus: 30 },
} as const satisfies TRoleRules;
