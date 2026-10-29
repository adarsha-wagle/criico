import { PLAYER_ROLES } from "@/config/constant";
import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const playerRoleEnums = pgEnum("player_role", PLAYER_ROLES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const players = pgTable("players", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  name: text("name").notNull(),
  role: playerRoleEnums("role").notNull(),
  basePrice: integer("base_price").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
  totalWickets: integer("total_wickets").notNull().default(0),
  ...timestamps,
});
