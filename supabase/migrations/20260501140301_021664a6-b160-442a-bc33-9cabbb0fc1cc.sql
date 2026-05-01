CREATE OR REPLACE FUNCTION public.trending_motm(_club text, _limit int DEFAULT 5)
RETURNS TABLE(player text, votes bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (array_agg(motm_player ORDER BY created_at DESC))[1] AS player,
    count(*) AS votes
  FROM public.matches
  WHERE created_at > now() - interval '30 days'
    AND (
      (is_away = true  AND lower(opponent) = lower(_club))
      OR (is_away = false AND stadium_id IN (
        SELECT id FROM public.stadiums WHERE lower(team) = lower(_club)
      ))
    )
    AND motm_player IS NOT NULL
    AND length(trim(motm_player)) > 0
  GROUP BY lower(trim(motm_player))
  ORDER BY votes DESC
  LIMIT _limit;
$$;

REVOKE EXECUTE ON FUNCTION public.trending_motm(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trending_motm(text, int) TO authenticated;