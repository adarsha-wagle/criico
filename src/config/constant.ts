export const PLAYER_ROLES = [
  "Batsman",
  "Bowler",
  "All-rounder",
  "Wicketkeeper",
] as const;

export type TPlayerRole = (typeof PLAYER_ROLES)[number];

export const USER_ROLES = ["admin", "viewer"] as const;
