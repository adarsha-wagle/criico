import { z } from "zod";

import { PLAYER_ROLES } from "@/config/constant";
import { IImpactScoreBreakdown } from "../types";
import { IPlayerStats } from "./player";

/** Query string for GET /api/leaderboard?role=Bowler&limit=10 */
export const leaderboardQuerySchema = z.object({
  role: z
    .enum(PLAYER_ROLES, {
      error: `role must be one of: ${PLAYER_ROLES.join(", ")}`,
    })
    .optional(),
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int({ error: "limit must be a whole number" })
    .min(1, { error: "limit must be at least 1" })
    .max(100, { error: "limit cannot exceed 100" })
    .default(50),
});
export type TLeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export interface ILeaderboardInput extends IPlayerStats {
  id: string;
  name: string;
}

export interface LeaderboardEntry<
  T extends ILeaderboardInput = ILeaderboardInput,
> {
  rank: number;
  player: T;
  impact: IImpactScoreBreakdown;
}
