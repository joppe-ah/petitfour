-- ============================================================
-- PetitFour — Complete Schema (idempotent, paste into SQL editor)
-- Covers: auth tables, all data tables, padel tables, RLS, indexes
-- ============================================================

-- ── Helpers ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- SECURITY DEFINER helper: avoids RLS recursion when policies
-- need to look up the caller's family_id from profiles.
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT family_id FROM profiles WHERE id = auth.uid() $$;

-- ── families ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.families (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "families_select" ON public.families;
CREATE POLICY "families_select" ON public.families
  FOR SELECT USING (id = get_my_family_id());

DROP POLICY IF EXISTS "families_insert" ON public.families;
CREATE POLICY "families_insert" ON public.families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "families_update" ON public.families;
CREATE POLICY "families_update" ON public.families
  FOR UPDATE USING (created_by = auth.uid());

-- ── profiles ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text NOT NULL DEFAULT '',
  avatar_url          text,
  avatar_preset       text,
  color_theme         text NOT NULL DEFAULT 'teal',
  dietary_preferences text[] NOT NULL DEFAULT '{}',
  family_id           uuid REFERENCES public.families(id) ON DELETE SET NULL,
  role                text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR family_id = get_my_family_id()
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── family_invites ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.family_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email      text NOT NULL,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites_select_admin" ON public.family_invites;
CREATE POLICY "invites_select_admin" ON public.family_invites
  FOR SELECT USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "invites_insert_admin" ON public.family_invites;
CREATE POLICY "invites_insert_admin" ON public.family_invites
  FOR INSERT WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "invites_delete_admin" ON public.family_invites;
CREATE POLICY "invites_delete_admin" ON public.family_invites
  FOR DELETE USING (family_id = get_my_family_id());

-- ── Auto-create profile on signup ─────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── categories ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  icon       text,
  color      text,
  group_type text NOT NULL,          -- needs | wants | savings
  is_custom  boolean DEFAULT false,
  is_active  boolean DEFAULT true
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (created_by = auth.uid());

-- ── recipes ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid REFERENCES public.families(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name         text NOT NULL,
  description  text,
  photo_url    text,
  category     text NOT NULL,
  season       text DEFAULT 'all',
  cooking_time integer,
  servings     integer DEFAULT 4,
  calories     integer,
  protein      numeric,
  carbs        numeric,
  fat          numeric,
  rating       integer DEFAULT 0,
  is_favourite boolean DEFAULT false,
  notes        text,
  tags         text[] DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recipes_family_id_idx  ON public.recipes(family_id);
CREATE INDEX IF NOT EXISTS recipes_created_by_idx ON public.recipes(created_by);
CREATE INDEX IF NOT EXISTS recipes_category_idx   ON public.recipes(category);
CREATE INDEX IF NOT EXISTS recipes_season_idx     ON public.recipes(season);

DROP TRIGGER IF EXISTS recipes_updated_at ON public.recipes;
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select" ON public.recipes;
CREATE POLICY "recipes_select" ON public.recipes
  FOR SELECT USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "recipes_insert" ON public.recipes;
CREATE POLICY "recipes_insert" ON public.recipes
  FOR INSERT WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "recipes_update" ON public.recipes;
CREATE POLICY "recipes_update" ON public.recipes
  FOR UPDATE USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "recipes_delete" ON public.recipes;
CREATE POLICY "recipes_delete" ON public.recipes
  FOR DELETE USING (family_id = get_my_family_id());

-- ── ingredients ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  name       text NOT NULL,
  amount     numeric NOT NULL,
  unit       text NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ingredients_recipe_id_idx ON public.ingredients(recipe_id);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_select" ON public.ingredients;
CREATE POLICY "ingredients_select" ON public.ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "ingredients_insert" ON public.ingredients;
CREATE POLICY "ingredients_insert" ON public.ingredients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "ingredients_update" ON public.ingredients;
CREATE POLICY "ingredients_update" ON public.ingredients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "ingredients_delete" ON public.ingredients;
CREATE POLICY "ingredients_delete" ON public.ingredients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

-- ── recipe_steps ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipe_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  description text NOT NULL
);

CREATE INDEX IF NOT EXISTS recipe_steps_recipe_id_idx ON public.recipe_steps(recipe_id);

ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_steps_select" ON public.recipe_steps;
CREATE POLICY "recipe_steps_select" ON public.recipe_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "recipe_steps_insert" ON public.recipe_steps;
CREATE POLICY "recipe_steps_insert" ON public.recipe_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "recipe_steps_update" ON public.recipe_steps;
CREATE POLICY "recipe_steps_update" ON public.recipe_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "recipe_steps_delete" ON public.recipe_steps;
CREATE POLICY "recipe_steps_delete" ON public.recipe_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.family_id = get_my_family_id())
  );

-- ── meal_plans ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        uuid REFERENCES public.families(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  date             date NOT NULL,
  dinner_recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (family_id, date)
);

CREATE INDEX IF NOT EXISTS meal_plans_family_id_idx ON public.meal_plans(family_id);
CREATE INDEX IF NOT EXISTS meal_plans_date_idx      ON public.meal_plans(date);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_plans_select" ON public.meal_plans;
CREATE POLICY "meal_plans_select" ON public.meal_plans
  FOR SELECT USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "meal_plans_insert" ON public.meal_plans;
CREATE POLICY "meal_plans_insert" ON public.meal_plans
  FOR INSERT WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "meal_plans_update" ON public.meal_plans;
CREATE POLICY "meal_plans_update" ON public.meal_plans
  FOR UPDATE USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "meal_plans_delete" ON public.meal_plans;
CREATE POLICY "meal_plans_delete" ON public.meal_plans
  FOR DELETE USING (family_id = get_my_family_id());

-- ── shopping_lists ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid REFERENCES public.families(id) ON DELETE CASCADE,
  week_number  integer NOT NULL,
  year         integer NOT NULL,
  generated_at timestamptz DEFAULT now(),
  UNIQUE (family_id, week_number, year)
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_lists_select" ON public.shopping_lists;
CREATE POLICY "shopping_lists_select" ON public.shopping_lists
  FOR SELECT USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_insert" ON public.shopping_lists;
CREATE POLICY "shopping_lists_insert" ON public.shopping_lists
  FOR INSERT WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_update" ON public.shopping_lists;
CREATE POLICY "shopping_lists_update" ON public.shopping_lists
  FOR UPDATE USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_delete" ON public.shopping_lists;
CREATE POLICY "shopping_lists_delete" ON public.shopping_lists
  FOR DELETE USING (family_id = get_my_family_id());

-- ── shopping_items ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name             text NOT NULL,
  amount           numeric,
  unit             text,
  category         text,
  is_checked       boolean DEFAULT false,
  is_manual        boolean DEFAULT false,
  recipe_ids       uuid[] DEFAULT '{}',
  sort_order       integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS shopping_items_list_id_idx ON public.shopping_items(shopping_list_id);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_items_select" ON public.shopping_items;
CREATE POLICY "shopping_items_select" ON public.shopping_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "shopping_items_insert" ON public.shopping_items;
CREATE POLICY "shopping_items_insert" ON public.shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "shopping_items_update" ON public.shopping_items;
CREATE POLICY "shopping_items_update" ON public.shopping_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "shopping_items_delete" ON public.shopping_items;
CREATE POLICY "shopping_items_delete" ON public.shopping_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id())
  );

-- ── transactions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,              -- expense | income
  amount      numeric NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  date        date NOT NULL,
  is_fixed    boolean DEFAULT false,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_created_by_idx  ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS transactions_date_idx        ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions(category_id);

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (created_by = auth.uid());

-- ── budgets ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  month       integer NOT NULL,
  year        integer NOT NULL,
  UNIQUE (created_by, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS budgets_created_by_idx ON public.budgets(created_by);
CREATE INDEX IF NOT EXISTS budgets_month_year_idx ON public.budgets(month, year);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;
CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (created_by = auth.uid());

-- ── fixed_costs ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fixed_costs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  amount       numeric NOT NULL,
  day_of_month integer NOT NULL,
  category_id  uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active    boolean DEFAULT true
);

ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fixed_costs_select" ON public.fixed_costs;
CREATE POLICY "fixed_costs_select" ON public.fixed_costs
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_insert" ON public.fixed_costs;
CREATE POLICY "fixed_costs_insert" ON public.fixed_costs
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_update" ON public.fixed_costs;
CREATE POLICY "fixed_costs_update" ON public.fixed_costs
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_delete" ON public.fixed_costs;
CREATE POLICY "fixed_costs_delete" ON public.fixed_costs
  FOR DELETE USING (created_by = auth.uid());

-- ── savings_goals ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by           uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  target_amount        numeric NOT NULL,
  saved_amount         numeric DEFAULT 0,
  monthly_contribution numeric DEFAULT 0,
  color                text DEFAULT 'blue',
  emoji                text DEFAULT '🎯',
  target_date          date,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_select" ON public.savings_goals;
CREATE POLICY "savings_goals_select" ON public.savings_goals
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_insert" ON public.savings_goals;
CREATE POLICY "savings_goals_insert" ON public.savings_goals
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_update" ON public.savings_goals;
CREATE POLICY "savings_goals_update" ON public.savings_goals
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_delete" ON public.savings_goals;
CREATE POLICY "savings_goals_delete" ON public.savings_goals
  FOR DELETE USING (created_by = auth.uid());

-- ── padel_players ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.padel_players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       uuid REFERENCES public.families(id) ON DELETE CASCADE,
  name            text NOT NULL,
  avatar_initials text NOT NULL DEFAULT '??',
  color           text NOT NULL DEFAULT '#1D9E75',
  type            text NOT NULL DEFAULT 'external' CHECK (type IN ('family', 'external')),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS padel_players_family_id_idx ON public.padel_players(family_id);

ALTER TABLE public.padel_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padel_players_select" ON public.padel_players;
CREATE POLICY "padel_players_select" ON public.padel_players
  FOR SELECT TO authenticated USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "padel_players_insert" ON public.padel_players;
CREATE POLICY "padel_players_insert" ON public.padel_players
  FOR INSERT TO authenticated WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "padel_players_delete" ON public.padel_players;
CREATE POLICY "padel_players_delete" ON public.padel_players
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ── padel_matches ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.padel_matches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         uuid REFERENCES public.families(id) ON DELETE CASCADE,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  date              timestamptz NOT NULL,
  location          text,
  team_a_player1_id uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_a_player2_id uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_b_player1_id uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  team_b_player2_id uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE RESTRICT,
  winner            text CHECK (winner IN ('teamA', 'teamB')),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS padel_matches_family_id_idx ON public.padel_matches(family_id);
CREATE INDEX IF NOT EXISTS padel_matches_date_idx      ON public.padel_matches(date DESC);

ALTER TABLE public.padel_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padel_matches_select" ON public.padel_matches;
CREATE POLICY "padel_matches_select" ON public.padel_matches
  FOR SELECT TO authenticated USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "padel_matches_insert" ON public.padel_matches;
CREATE POLICY "padel_matches_insert" ON public.padel_matches
  FOR INSERT TO authenticated WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "padel_matches_delete" ON public.padel_matches;
CREATE POLICY "padel_matches_delete" ON public.padel_matches
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ── padel_sets ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.padel_sets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     uuid NOT NULL REFERENCES public.padel_matches(id) ON DELETE CASCADE,
  set_number   integer NOT NULL,
  team_a_score integer NOT NULL,
  team_b_score integer NOT NULL,
  UNIQUE (match_id, set_number)
);

ALTER TABLE public.padel_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "padel_sets_select" ON public.padel_sets;
CREATE POLICY "padel_sets_select" ON public.padel_sets
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.padel_matches m
      WHERE m.id = match_id AND m.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "padel_sets_insert" ON public.padel_sets;
CREATE POLICY "padel_sets_insert" ON public.padel_sets
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.padel_matches m
      WHERE m.id = match_id AND m.family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "padel_sets_delete" ON public.padel_sets;
CREATE POLICY "padel_sets_delete" ON public.padel_sets
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.padel_matches m
      WHERE m.id = match_id AND m.created_by = auth.uid())
  );

-- ── Storage buckets ───────────────────────────────────────────
-- Run in Supabase dashboard: Storage → New bucket
--   recipe-photos  public=true  max_size=5242880  (5 MB)
--   avatars        public=true  max_size=2097152   (2 MB)
--
-- Or via CLI:
--   supabase storage create recipe-photos --public
--   supabase storage create avatars --public
-- ─────────────────────────────────────────────────────────────
