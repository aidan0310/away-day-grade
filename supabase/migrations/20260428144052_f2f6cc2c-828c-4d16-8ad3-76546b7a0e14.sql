
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  supported_team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Stadiums
CREATE TABLE public.stadiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stadiums viewable by all auth" ON public.stadiums FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert stadiums" ON public.stadiums FOR INSERT TO authenticated WITH CHECK (true);

-- Matches (reviews)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  is_away BOOLEAN NOT NULL DEFAULT false,
  atmosphere SMALLINT NOT NULL CHECK (atmosphere BETWEEN 1 AND 10),
  view_rating SMALLINT NOT NULL CHECK (view_rating BETWEEN 1 AND 10),
  scran SMALLINT NOT NULL CHECK (scran BETWEEN 1 AND 10),
  damage SMALLINT NOT NULL CHECK (damage BETWEEN 1 AND 10),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches viewable by all auth" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own matches" ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own matches" ON public.matches FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_matches_stadium ON public.matches(stadium_id);
CREATE INDEX idx_matches_created ON public.matches(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
