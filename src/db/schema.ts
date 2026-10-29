import { PLAYER_ROLES, USER_ROLES } from "@/config/constant";
import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  text,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

export const playerRoleEnum = pgEnum("player_role", PLAYER_ROLES);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

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
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  role: playerRoleEnum("role").notNull(),
  basePrice: integer("base_price").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
  totalWickets: integer("total_wickets").notNull().default(0),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // store lower-cased
  passwordHash: text("password_hash").notNull(), // bcrypt
  role: userRoleEnum("role").notNull().default("admin"),
  ...timestamps,
});
