-- Crowdsourced players table for MOTM autocomplete
CREATE TABLE public.global_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club text NOT NULL,
  name text NOT NULL,
  name_normalized text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club, name_normalized)
);

CREATE INDEX idx_global_players_club ON public.global_players(club);
CREATE INDEX idx_global_players_search ON public.global_players(club, name_normalized);

ALTER TABLE public.global_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players viewable by all auth"
  ON public.global_players FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Auth users insert players"
  ON public.global_players FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

-- Trending: top voted players per club in the last 30 days.
-- For away matches the rated team is the opponent; for home it's the supported club
-- but we don't store that, so we resolve trending by club name passed in.
-- A SQL function makes this efficient and reusable from the client.
CREATE OR REPLACE FUNCTION public.trending_motm(_club text, _limit int DEFAULT 5)
RETURNS TABLE(player text, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- canonical display name = most recent casing seen
    (array_agg(motm_player ORDER BY created_at DESC))[1] AS player,
    count(*) AS votes
  FROM public.matches
  WHERE created_at > now() - interval '30 days'
    AND (
      (is_away = true  AND lower(opponent) = lower(_club))
      -- home matches: rated team = stadium's home team. We approximate by
      -- joining stadiums.team when present.
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