ALTER TABLE "servers" ADD COLUMN "trust_previous" integer;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "trust_previous_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "servers_trust_delta_idx" ON "servers" USING btree ("trust_previous_at" DESC NULLS LAST,"trust_total" DESC NULLS LAST);