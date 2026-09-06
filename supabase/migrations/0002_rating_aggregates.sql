-- Keeps servers.rating_avg / rating_count in sync with the ratings table.
--
-- Recomputing the aggregate in a trigger means the browse and detail pages
-- never need to JOIN or aggregate at read time — which is what keeps them
-- cheap enough to serve from a free-tier database on launch day.

CREATE OR REPLACE FUNCTION public.refresh_server_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_id UUID := COALESCE(NEW.server_id, OLD.server_id);
BEGIN
  UPDATE public.servers s
  SET
    rating_avg = COALESCE(agg.avg_rating, 0),
    rating_count = COALESCE(agg.total, 0)
  FROM (
    SELECT
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      COUNT(*) AS total
    FROM public.ratings
    WHERE server_id = target_id
  ) AS agg
  WHERE s.id = target_id;

  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ratings_refresh_server_rating
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_server_rating();
--> statement-breakpoint

-- Bump servers.updated_at on every write, so cache invalidation and the
-- "recently updated" sort have a trustworthy signal.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER servers_touch_updated_at
BEFORE UPDATE ON public.servers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
