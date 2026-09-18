CREATE TABLE "sponsorships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"charged_minor" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text NOT NULL,
	"payment_id" text,
	"email" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sponsorships_provider_ref_key" ON "sponsorships" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE INDEX "sponsorships_active_idx" ON "sponsorships" USING btree ("status","ends_at");--> statement-breakpoint
CREATE INDEX "sponsorships_server_id_idx" ON "sponsorships" USING btree ("server_id");--> statement-breakpoint
-- Sponsorships hold buyer emails and payment references. RLS on with no
-- policies means the anon and authenticated roles see nothing; only the
-- server-side connection and the service role read or write this table.
ALTER TABLE "sponsorships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_amount_positive" CHECK ("amount_cents" > 0 AND "charged_minor" > 0);--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_currency_valid" CHECK ("currency" IN ('USD', 'INR'));--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_status_valid" CHECK ("status" IN ('pending', 'active', 'removed'));
