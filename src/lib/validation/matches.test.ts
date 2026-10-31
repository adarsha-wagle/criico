import { describe, expect, it } from "vitest";
import { matchInputSchema, resultMismatch } from "./matches";

const names = { A: "Lumbini Lions", B: "Pokhara Avengers" };

describe("resultMismatch", () => {
  it("accepts a winner with more runs", () => {
    expect(resultMismatch("A", { A: 160, B: 150 }, names)).toBeNull();
    expect(resultMismatch("B", { A: 150, B: 160 }, names)).toBeNull();
  });

  it("rejects a winner with fewer or equal runs", () => {
    expect(resultMismatch("A", { A: 150, B: 160 }, names)).toMatch(
      /Lumbini Lions can't win/,
    );
    expect(resultMismatch("B", { A: 150, B: 150 }, names)).toMatch(
      /Pokhara Avengers can't win/,
    );
  });

  it("only accepts a draw on equal runs", () => {
    expect(resultMismatch("draw", { A: 150, B: 150 }, names)).toBeNull();
    expect(resultMismatch("draw", { A: 151, B: 150 }, names)).toMatch(
      /same runs/,
    );
  });
});

describe("matchInputSchema", () => {
  it("refuses a result the scorecard contradicts", () => {
    const parsed = matchInputSchema.safeParse({
      teamA: names.A,
      teamB: names.B,
      result: "A",
      performances: [
        {
          playerId: "11111111-1111-4111-8111-111111111111",
          team: "A",
          runs: 40,
          wickets: 0,
        },
        {
          playerId: "22222222-2222-4222-8222-222222222222",
          team: "B",
          runs: 90,
          wickets: 2,
        },
      ],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].path).toEqual(["result"]);
  });
});
