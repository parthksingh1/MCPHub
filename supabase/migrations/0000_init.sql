-- Initial MCPHub schema.
--
-- The `auth` schema and `auth.users` already exist on hosted Supabase (GoTrue
-- owns them); those two statements are made idempotent so this migration
-- applies cleanly both there and against a bare local Postgres.

-- `array_to_string` is only STABLE, so Postgres refuses it inside a generated
-- column. For a `text[]` it is in fact deterministic — the volatility marking is
-- conservative, covering element types whose output function is not immutable.
-- This wrapper narrows it to text[] and asserts that, which is the standard
-- workaround for building a tsvector from an array column.
CREATE OR REPLACE FUNCTION public.immutable_array_to_string(arr text[], sep text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT array_to_string(arr, sep);
$$;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crawl_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_type" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text,
	"stats" jsonb,
	"error_log" text
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_server_id_pk" PRIMARY KEY("user_id","server_id")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_rating_range" CHECK ("ratings"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"reported_by" uuid,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"author_name" text,
	"author_github" text,
	"author_avatar" text,
	"is_official" boolean DEFAULT false NOT NULL,
	"source_type" text NOT NULL,
	"repo_url" text NOT NULL,
	"package_name" text,
	"homepage_url" text,
	"categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"language" text,
	"license" text,
	"compatible_clients" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"transport" text[] DEFAULT '{}'::text[] NOT NULL,
	"install_commands" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"github_stars" integer DEFAULT 0 NOT NULL,
	"github_forks" integer DEFAULT 0 NOT NULL,
	"github_issues" integer DEFAULT 0 NOT NULL,
	"last_commit_at" timestamp with time zone,
	"first_release_at" timestamp with time zone,
	"npm_weekly_downloads" integer,
	"pypi_monthly_downloads" integer,
	"security" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trust_total" integer DEFAULT 0 NOT NULL,
	"trust_maintenance" integer DEFAULT 0 NOT NULL,
	"trust_popularity" integer DEFAULT 0 NOT NULL,
	"trust_security" integer DEFAULT 0 NOT NULL,
	"trust_quality" integer DEFAULT 0 NOT NULL,
	"trust_computed_at" timestamp with time zone,
	"live_status" jsonb,
	"rating_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"deprecated" boolean DEFAULT false NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || public.immutable_array_to_string(coalesce(tags, '{}'::text[]), ' '))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"indexed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_url" text NOT NULL,
	"submitted_by" uuid,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"server_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crawl_logs_run_type_started_at_idx" ON "crawl_logs" USING btree ("run_type","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_server_user_key" ON "ratings" USING btree ("server_id","user_id");--> statement-breakpoint
CREATE INDEX "ratings_server_id_idx" ON "ratings" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "reports_server_id_idx" ON "reports" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "servers_slug_key" ON "servers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "servers_repo_url_key" ON "servers" USING btree ("repo_url");--> statement-breakpoint
CREATE INDEX "servers_trust_total_idx" ON "servers" USING btree ("trust_total" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "servers_github_stars_idx" ON "servers" USING btree ("github_stars" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "servers_updated_at_idx" ON "servers" USING btree ("updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "servers_categories_idx" ON "servers" USING gin ("categories");--> statement-breakpoint
CREATE INDEX "servers_search_vector_idx" ON "servers" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_submitted_by_idx" ON "submissions" USING btree ("submitted_by");