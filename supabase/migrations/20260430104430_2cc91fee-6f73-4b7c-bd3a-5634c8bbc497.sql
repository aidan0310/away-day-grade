ALTER TABLE public.matches 
ADD COLUMN motm_player text NOT NULL DEFAULT 'Unknown',
ADD COLUMN motm_comment text;

ALTER TABLE public.matches ALTER COLUMN motm_player DROP DEFAULT;