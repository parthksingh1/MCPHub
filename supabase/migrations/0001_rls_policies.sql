-- Row Level Security for every MCPHub table.
--
-- RLS is the entire authorisation layer: the browser talks to Supabase with the
-- anon key and the database decides what it may see. Route Handlers therefore
-- carry no hand-rolled ownership checks. Background workers use the service-role
-- key, which bypasses RLS by design.
--
-- Admins are identified by an `is_admin` claim in the user's app_metadata.
-- `auth.jwt()` reads it straight off the token, with no extra round-trip.
--
-- Ownership predicates are written as `(SELECT auth.uid()) = user_id` rather
-- than `auth.uid() = user_id`: the subquery form is evaluated once per query
-- instead of once per row, which is a large difference on wide scans.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;
--> statement-breakpoint

-- servers: world-readable catalogue. Only the service role writes.
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "servers_public_read" ON public.servers FOR SELECT
  TO anon, authenticated USING (deprecated = false);
--> statement-breakpoint
CREATE POLICY "servers_admin_read_all" ON public.servers FOR SELECT
  TO authenticated USING (public.is_admin());
--> statement-breakpoint
CREATE POLICY "servers_admin_update" ON public.servers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
--> statement-breakpoint

-- ratings: publicly readable; a user may only write their own row.
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ratings_public_read" ON public.ratings FOR SELECT
  TO anon, authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ratings_insert_own" ON public.ratings FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "ratings_update_own" ON public.ratings FOR UPDATE
  TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "ratings_delete_own" ON public.ratings FOR DELETE
  TO authenticated USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint

-- favorites: entirely private to the owning user.
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT
  TO authenticated USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE
  TO authenticated USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint

-- submissions: any signed-in user may submit; they see only their own.
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "submissions_insert_authenticated" ON public.submissions FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = submitted_by);
--> statement-breakpoint
CREATE POLICY "submissions_select_own" ON public.submissions FOR SELECT
  TO authenticated USING ((SELECT auth.uid()) = submitted_by);
--> statement-breakpoint
CREATE POLICY "submissions_admin_read_all" ON public.submissions FOR SELECT
  TO authenticated USING (public.is_admin());
--> statement-breakpoint
CREATE POLICY "submissions_admin_update" ON public.submissions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
--> statement-breakpoint

-- reports: write-only for users (no read-back), full visibility for admins.
-- Reporters cannot read the table, so they cannot enumerate others' reports.
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "reports_insert_authenticated" ON public.reports FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = reported_by);
--> statement-breakpoint
CREATE POLICY "reports_admin_read" ON public.reports FOR SELECT
  TO authenticated USING (public.is_admin());
--> statement-breakpoint
CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
--> statement-breakpoint

-- crawl_logs: operational data. RLS on with only an admin SELECT policy means
-- anon and ordinary users get nothing; the service role bypasses RLS entirely.
ALTER TABLE public.crawl_logs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "crawl_logs_admin_read" ON public.crawl_logs FOR SELECT
  TO authenticated USING (public.is_admin());
