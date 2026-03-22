-- ── Padel tables ──────────────────────────────────────────────────────────────

-- Players
CREATE TABLE IF NOT EXISTS public.padel_players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  avatar_initials text NOT NULL,
  color         text NOT NULL DEFAULT '#1D9E75',
  type          text NOT NULL DEFAULT 'external' CHECK (type IN ('family', 'external')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Matches
CREATE TABLE IF NOT EXISTS public.padel_matches (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  date NOT NULL,
  location              text NOT NULL,
  team_a_player1_id     uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_a_player2_id     uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_b_player1_id     uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_b_player2_id     uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  winner                text NOT NULL CHECK (winner IN ('teamA', 'teamB')),
  notes                 text,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Sets (child of matches)
CREATE TABLE IF NOT EXISTS public.padel_sets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES public.padel_matches(id) ON DELETE CASCADE,
  set_number    int NOT NULL,
  team_a_score  int NOT NULL,
  team_b_score  int NOT NULL,
  UNIQUE (match_id, set_number)
);

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE public.padel_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padel_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padel_sets    ENABLE ROW LEVEL SECURITY;

-- Players: all authenticated users can read; only creator can modify
DROP POLICY IF EXISTS padel_players_select ON public.padel_players;
CREATE POLICY padel_players_select ON public.padel_players
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS padel_players_insert ON public.padel_players;
CREATE POLICY padel_players_insert ON public.padel_players
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS padel_players_delete ON public.padel_players;
CREATE POLICY padel_players_delete ON public.padel_players
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Matches: all authenticated users can read; only creator can modify
DROP POLICY IF EXISTS padel_matches_select ON public.padel_matches;
CREATE POLICY padel_matches_select ON public.padel_matches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS padel_matches_insert ON public.padel_matches;
CREATE POLICY padel_matches_insert ON public.padel_matches
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS padel_matches_delete ON public.padel_matches;
CREATE POLICY padel_matches_delete ON public.padel_matches
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Sets: follow match access
DROP POLICY IF EXISTS padel_sets_select ON public.padel_sets;
CREATE POLICY padel_sets_select ON public.padel_sets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS padel_sets_insert ON public.padel_sets;
CREATE POLICY padel_sets_insert ON public.padel_sets
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS padel_sets_delete ON public.padel_sets;
CREATE POLICY padel_sets_delete ON public.padel_sets
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.padel_matches m
      WHERE m.id = match_id AND m.created_by = auth.uid()
    )
  );
