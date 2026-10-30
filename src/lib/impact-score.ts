import {
  PLAYER_ROLES,
  ROLE_RULES,
  ROOKIE_MATCH_LIMIT,
  ROOKIE_PENALTY,
  RUN_WEIGHT,
  VETERAN_BONUS,
  VETERAN_MATCH_LIMIT,
  WICKET_WEIGHT,
} from "@/config/constant";
import { IImpactScoreBreakdown, IPlayerStats, IRoleRule } from "./types";

function assertValidStats(stats: IPlayerStats): void {
  for (const field of ["matchesPlayed", "totalRuns", "totalWickets"] as const) {
    const value = stats[field];
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidPlayerStatsError(field, value);
    }
  }
  if (!PLAYER_ROLES.includes(stats.role)) {
    throw new InvalidPlayerStatsError("role", stats.role);
  }
}
export class InvalidPlayerStatsError extends Error {
  constructor(field: keyof IPlayerStats, value: unknown) {
    super(
      `Invalid ${field}: ${String(value)} (must be a non-negative integer)`,
    );
    this.name = "InvalidPlayerStatsError";
  }
}

export function experienceAdjustment(matchesPlayed: number): number {
  if (matchesPlayed < ROOKIE_MATCH_LIMIT) return ROOKIE_PENALTY;
  if (matchesPlayed > VETERAN_MATCH_LIMIT) return VETERAN_BONUS;
  return 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateImpactBreakdown(
  stats: IPlayerStats,
): IImpactScoreBreakdown {
  assertValidStats(stats);

  const rule: IRoleRule = ROLE_RULES[stats.role];

  // Role multiplier is applied to the raw stat BEFORE the base weights.
  const runPoints = stats.totalRuns * rule.runMultiplier * RUN_WEIGHT;
  const wicketPoints =
    stats.totalWickets * rule.wicketMultiplier * WICKET_WEIGHT;
  const roleBonus = rule.flatBonus;
  const expAdj = experienceAdjustment(stats.matchesPlayed);

  return {
    runPoints: round2(runPoints),
    wicketPoints: round2(wicketPoints),
    roleBonus,
    experienceAdjustment: expAdj,
    total: round2(runPoints + wicketPoints + roleBonus + expAdj),
  };
}

export function calculateImpactScore(stats: IPlayerStats): number {
  return calculateImpactBreakdown(stats).total;
}
