import { describe, expect, it } from "vitest";
import { ROLE_RULES } from "@/config/constant";
import {
  calculateImpactBreakdown,
  calculateImpactScore,
  experienceAdjustment,
  InvalidPlayerStatsError,
} from "./impact-score";
import type { WicketkeeperRule } from "./types";

describe("calculateImpactScore", () => {
  it("gives a Bowler with 0 matches only the rookie penalty", () => {
    expect(
      calculateImpactScore({
        role: "Bowler",
        matchesPlayed: 0,
        totalRuns: 0,
        totalWickets: 0,
      }),
    ).toBe(-50);
  });

  it("multiplies a Bowler's wickets by 1.5 before the base weight", () => {
    // 50 * 1.2 + (10 * 1.5) * 20 - 50 (rookie) = 60 + 300 - 50
    expect(
      calculateImpactScore({
        role: "Bowler",
        matchesPlayed: 3,
        totalRuns: 50,
        totalWickets: 10,
      }),
    ).toBe(310);
  });

  it("multiplies a Batsman's runs by 1.3 before the base weight", () => {
    // (100 * 1.3) * 1.2 + 2 * 20 = 156 + 40, no experience adjustment at 10 matches
    expect(
      calculateImpactScore({
        role: "Batsman",
        matchesPlayed: 10,
        totalRuns: 100,
        totalWickets: 2,
      }),
    ).toBe(196);
  });

  it("gives a veteran Wicketkeeper with high runs +30 and +100, and no Bowler multiplier", () => {
    // 1500 * 1.2 + 4 * 20 (not 4 * 1.5 * 20) + 30 + 100
    expect(
      calculateImpactBreakdown({
        role: "Wicketkeeper",
        matchesPlayed: 25,
        totalRuns: 1500,
        totalWickets: 4,
      }),
    ).toEqual({
      runPoints: 1800,
      wicketPoints: 80,
      roleBonus: 30,
      experienceAdjustment: 100,
      total: 2010,
    });
  });

  it("only penalises under 5 matches and only rewards over 20", () => {
    expect(experienceAdjustment(4)).toBe(-50);
    expect(experienceAdjustment(5)).toBe(0);
    expect(experienceAdjustment(20)).toBe(0);
    expect(experienceAdjustment(21)).toBe(100);
  });

  it("rejects negative Total Runs", () => {
    expect(() =>
      calculateImpactScore({
        role: "Batsman",
        matchesPlayed: 10,
        totalRuns: -5,
        totalWickets: 0,
      }),
    ).toThrow(InvalidPlayerStatsError);
  });
});

describe("Wicketkeeper rule", () => {
  it("can never carry the Bowler wicket multiplier", () => {
    expect(ROLE_RULES.Wicketkeeper.wicketMultiplier).toBe(1);

    const invalid: WicketkeeperRule = {
      runMultiplier: 1,
      // @ts-expect-error: wicketMultiplier is typed as the literal 1 for a Wicketkeeper.
      wicketMultiplier: 1.5,
      flatBonus: 30,
    };
    expect(invalid).toBeDefined();
  });
});
