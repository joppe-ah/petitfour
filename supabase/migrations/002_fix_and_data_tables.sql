-- ============================================================
-- PetitFour — Migration 002
-- Fixes:
--   1. Recursive profiles_select RLS policy → 500 on every profile query
--   2. Creates all missing data tables (money, cookbook, planner)
-- Run in: Supabase SQL Editor
-- ============================================================

-- ── 1. Fix profiles RLS recursion ─────────────────────────────
--
-- The original "profiles_select" policy subquery re-queries profiles,
-- which re-triggers the same policy → infinite recursion → HTTP 500.
-- Fix: a SECURITY DEFINER function bypasses RLS for the inner lookup.

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR family_id = get_my_family_id()
  );

-- Also fix the same recursion in families_select
DROP POLICY IF EXISTS "families_select" ON families;
CREATE POLICY "families_select" ON families
  FOR SELECT USING (
    id = get_my_family_id()
  );

-- And fix family_invites (same pattern)
DROP POLICY IF EXISTS "invites_select_admin" ON family_invites;
CREATE POLICY "invites_select_admin" ON family_invites
  FOR SELECT USING (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "invites_insert_admin" ON family_invites;
CREATE POLICY "invites_insert_admin" ON family_invites
  FOR INSERT WITH CHECK (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "invites_delete_admin" ON family_invites;
CREATE POLICY "invites_delete_admin" ON family_invites
  FOR DELETE USING (
    family_id = get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 2. Helper: updated_at trigger ─────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── 3. categories ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  icon          text,
  color         text,
  group_type    text NOT NULL,
  is_custom     boolean DEFAULT false,
  is_active     boolean DEFAULT true
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (created_by = auth.uid());

-- ── 4. recipes ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id       uuid REFERENCES families(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  photo_url       text,
  category        text NOT NULL,
  season          text DEFAULT 'all',
  cooking_time    integer,
  servings        integer DEFAULT 4,
  calories        integer,
  protein         numeric,
  carbs           numeric,
  fat             numeric,
  rating          integer DEFAULT 0,
  is_favourite    boolean DEFAULT false,
  notes           text,
  tags            text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Add columns if table already existed without them (sprint 8 ALTER was a no-op if table didn't exist)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS family_id  uuid REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_url  text;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS season     text DEFAULT 'all';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_favourite boolean DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes      text;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tags       text[] DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS recipes_family_id_idx  ON recipes(family_id);
CREATE INDEX IF NOT EXISTS recipes_created_by_idx ON recipes(created_by);

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select" ON recipes;
CREATE POLICY "recipes_select" ON recipes
  FOR SELECT USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
    OR family_id IS NULL
  );

DROP POLICY IF EXISTS "recipes_insert" ON recipes;
CREATE POLICY "recipes_insert" ON recipes
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "recipes_update" ON recipes;
CREATE POLICY "recipes_update" ON recipes
  FOR UPDATE USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "recipes_delete" ON recipes;
CREATE POLICY "recipes_delete" ON recipes
  FOR DELETE USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
  );

-- ── 5. ingredients ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingredients (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   uuid REFERENCES recipes(id) ON DELETE CASCADE,
  name        text NOT NULL,
  amount      numeric NOT NULL,
  unit        text NOT NULL,
  sort_order  integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ingredients_recipe_id_idx ON ingredients(recipe_id);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_select" ON ingredients;
CREATE POLICY "ingredients_select" ON ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ingredients_insert" ON ingredients;
CREATE POLICY "ingredients_insert" ON ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ingredients_update" ON ingredients;
CREATE POLICY "ingredients_update" ON ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "ingredients_delete" ON ingredients;
CREATE POLICY "ingredients_delete" ON ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

-- ── 6. recipe_steps ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_steps (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   uuid REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  description text NOT NULL
);

CREATE INDEX IF NOT EXISTS recipe_steps_recipe_id_idx ON recipe_steps(recipe_id);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_steps_select" ON recipe_steps;
CREATE POLICY "recipe_steps_select" ON recipe_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "recipe_steps_insert" ON recipe_steps;
CREATE POLICY "recipe_steps_insert" ON recipe_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "recipe_steps_update" ON recipe_steps;
CREATE POLICY "recipe_steps_update" ON recipe_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "recipe_steps_delete" ON recipe_steps;
CREATE POLICY "recipe_steps_delete" ON recipe_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (r.family_id = get_my_family_id() OR r.created_by = auth.uid())
    )
  );

-- ── 7. meal_plans ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meal_plans (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id         uuid REFERENCES families(id) ON DELETE CASCADE,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  date              date NOT NULL,
  dinner_recipe_id  uuid REFERENCES recipes(id) ON DELETE SET NULL,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (family_id, date)
);

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS family_id  uuid REFERENCES families(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS meal_plans_family_id_idx ON meal_plans(family_id);
CREATE INDEX IF NOT EXISTS meal_plans_date_idx      ON meal_plans(date);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_plans_select" ON meal_plans;
CREATE POLICY "meal_plans_select" ON meal_plans
  FOR SELECT USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
    OR family_id IS NULL
  );

DROP POLICY IF EXISTS "meal_plans_insert" ON meal_plans;
CREATE POLICY "meal_plans_insert" ON meal_plans
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "meal_plans_update" ON meal_plans;
CREATE POLICY "meal_plans_update" ON meal_plans
  FOR UPDATE USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "meal_plans_delete" ON meal_plans;
CREATE POLICY "meal_plans_delete" ON meal_plans
  FOR DELETE USING (
    family_id = get_my_family_id()
    OR created_by = auth.uid()
  );

-- ── 8. shopping_lists ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shopping_lists (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     uuid REFERENCES families(id) ON DELETE CASCADE,
  week_number   integer NOT NULL,
  year          integer NOT NULL,
  generated_at  timestamptz DEFAULT now(),
  UNIQUE (family_id, week_number, year)
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_lists_select" ON shopping_lists;
CREATE POLICY "shopping_lists_select" ON shopping_lists
  FOR SELECT USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_insert" ON shopping_lists;
CREATE POLICY "shopping_lists_insert" ON shopping_lists
  FOR INSERT WITH CHECK (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_update" ON shopping_lists;
CREATE POLICY "shopping_lists_update" ON shopping_lists
  FOR UPDATE USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "shopping_lists_delete" ON shopping_lists;
CREATE POLICY "shopping_lists_delete" ON shopping_lists
  FOR DELETE USING (family_id = get_my_family_id());

-- ── 9. shopping_items ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shopping_items (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id  uuid REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name              text NOT NULL,
  amount            numeric,
  unit              text,
  category          text,
  is_checked        boolean DEFAULT false,
  is_manual         boolean DEFAULT false,
  recipe_ids        uuid[] DEFAULT '{}',
  sort_order        integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS shopping_items_list_id_idx ON shopping_items(shopping_list_id);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_items_select" ON shopping_items;
CREATE POLICY "shopping_items_select" ON shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id()
    )
  );

DROP POLICY IF EXISTS "shopping_items_insert" ON shopping_items;
CREATE POLICY "shopping_items_insert" ON shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id()
    )
  );

DROP POLICY IF EXISTS "shopping_items_update" ON shopping_items;
CREATE POLICY "shopping_items_update" ON shopping_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id()
    )
  );

DROP POLICY IF EXISTS "shopping_items_delete" ON shopping_items;
CREATE POLICY "shopping_items_delete" ON shopping_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.family_id = get_my_family_id()
    )
  );

-- ── 10. transactions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type          text NOT NULL,
  amount        numeric NOT NULL,
  description   text NOT NULL,
  category_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  date          date NOT NULL,
  is_fixed      boolean DEFAULT false,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_created_by_idx  ON transactions(created_by);
CREATE INDEX IF NOT EXISTS transactions_date_idx        ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON transactions(category_id);

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (created_by = auth.uid());

-- ── 11. budgets ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category_id   uuid REFERENCES categories(id) ON DELETE CASCADE,
  amount        numeric NOT NULL,
  month         integer NOT NULL,
  year          integer NOT NULL,
  UNIQUE (created_by, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS budgets_created_by_idx ON budgets(created_by);
CREATE INDEX IF NOT EXISTS budgets_month_year_idx  ON budgets(month, year);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_update" ON budgets;
CREATE POLICY "budgets_update" ON budgets
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_delete" ON budgets
  FOR DELETE USING (created_by = auth.uid());

-- ── 12. fixed_costs ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fixed_costs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  amount        numeric NOT NULL,
  day_of_month  integer NOT NULL,
  category_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active     boolean DEFAULT true
);

ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fixed_costs_select" ON fixed_costs;
CREATE POLICY "fixed_costs_select" ON fixed_costs
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_insert" ON fixed_costs;
CREATE POLICY "fixed_costs_insert" ON fixed_costs
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_update" ON fixed_costs;
CREATE POLICY "fixed_costs_update" ON fixed_costs
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "fixed_costs_delete" ON fixed_costs;
CREATE POLICY "fixed_costs_delete" ON fixed_costs
  FOR DELETE USING (created_by = auth.uid());

-- ── 13. savings_goals ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS savings_goals (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by            uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  target_amount         numeric NOT NULL,
  saved_amount          numeric DEFAULT 0,
  monthly_contribution  numeric DEFAULT 0,
  color                 text DEFAULT 'blue',
  emoji                 text DEFAULT '🎯',
  target_date           date,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS savings_goals_updated_at ON savings_goals;
CREATE TRIGGER savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_select" ON savings_goals;
CREATE POLICY "savings_goals_select" ON savings_goals
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_insert" ON savings_goals;
CREATE POLICY "savings_goals_insert" ON savings_goals
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_update" ON savings_goals;
CREATE POLICY "savings_goals_update" ON savings_goals
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "savings_goals_delete" ON savings_goals;
CREATE POLICY "savings_goals_delete" ON savings_goals
  FOR DELETE USING (created_by = auth.uid());
