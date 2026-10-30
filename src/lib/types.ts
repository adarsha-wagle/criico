import { TPlayerRole } from "./validation/player";

export interface IRoleRule {
  runMultiplier: number;
  wicketMultiplier: number;
  flatBonus: number;
}

export interface WicketkeeperRule extends IRoleRule {
  runMultiplier: 1;
  wicketMultiplier: 1;
  flatBonus: 30;
}

export type TRoleRules = {
  [R in Exclude<TPlayerRole, "Wicketkeeper">]: IRoleRule;
} & {
  Wicketkeeper: WicketkeeperRule;
};

export interface IImpactScoreBreakdown {
  runPoints: number;
  wicketPoints: number;
  roleBonus: number;
  experienceAdjustment: number;
  total: number;
}
