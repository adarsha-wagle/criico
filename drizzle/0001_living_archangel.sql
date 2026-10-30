CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'in_progress', 'completed', 'draw');--> statement-breakpoint
CREATE TABLE "match_performances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"wickets" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perf_match_player_uq" UNIQUE("match_id","player_id"),
	CONSTRAINT "perf_runs_nonneg" CHECK ("match_performances"."runs" >= 0),
	CONSTRAINT "perf_wickets_nonneg" CHECK ("match_performances"."wickets" >= 0 AND "match_performances"."wickets" <= 10)
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid NOT NULL,
	"winner_team_id" uuid,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" uuid,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	CONSTRAINT "matches_distinct_teams" CHECK ("matches"."team_a_id" <> "matches"."team_b_id"),
	CONSTRAINT "matches_valid_winner" CHECK (
        "matches"."winner_team_id" IS NULL
        OR "matches"."winner_team_id" IN ("matches"."team_a_id", "matches"."team_b_id")
      ),
	CONSTRAINT "matches_valid_result" CHECK (
        (
          "matches"."status" IN ('scheduled', 'in_progress')
          AND "matches"."winner_team_id" IS NULL
        )
        OR
        (
          "matches"."status" = 'completed'
          AND "matches"."winner_team_id" IS NOT NULL
        )
        OR
        (
          "matches"."status" = 'draw'
          AND "matches"."winner_team_id" IS NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "match_performances" ADD CONSTRAINT "match_performances_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_performances" ADD CONSTRAINT "match_performances_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_performances" ADD CONSTRAINT "match_performances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "perf_player_idx" ON "match_performances" USING btree ("player_id");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_base_price_nonneg" CHECK ("players"."base_price" >= 0);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_matches_nonneg" CHECK ("players"."matches_played" >= 0);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_runs_nonneg" CHECK ("players"."total_runs" >= 0);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_wickets_nonneg" CHECK ("players"."total_wickets" >= 0);