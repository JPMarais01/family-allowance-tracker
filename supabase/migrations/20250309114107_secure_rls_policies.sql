BEGIN;

-- First, disable all RLS to make changes
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Families are viewable by owners" ON families;
DROP POLICY IF EXISTS "Families are insertable by authenticated users" ON families;
DROP POLICY IF EXISTS "Families are updatable by owners" ON families;
DROP POLICY IF EXISTS "Families are deletable by owners" ON families;

DROP POLICY IF EXISTS "Family members viewable by family members" ON family_members;
DROP POLICY IF EXISTS "Family members deletable by parents" ON family_members;
DROP POLICY IF EXISTS "Family members viewable by owners" ON family_members;
DROP POLICY IF EXISTS "Family members viewable by self" ON family_members;
DROP POLICY IF EXISTS "Family members viewable by family" ON family_members;
DROP POLICY IF EXISTS "Family members insertable by owners" ON family_members;
DROP POLICY IF EXISTS "Family members deletable by owners" ON family_members;
DROP POLICY IF EXISTS "Family members insertable by parents" ON family_members;

DROP POLICY IF EXISTS "Family settings viewable by family members" ON family_settings;
DROP POLICY IF EXISTS "Family settings editable by family parents" ON family_settings;
DROP POLICY IF EXISTS "Family settings deletable by parents" ON family_settings;
DROP POLICY IF EXISTS "Family settings viewable by owners" ON family_settings;
DROP POLICY IF EXISTS "Family settings viewable by members" ON family_settings;
DROP POLICY IF EXISTS "Family settings editable by owners" ON family_settings;

DROP POLICY IF EXISTS "Budget cycles viewable by family members" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles insertable by family parents" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles deletable by parents" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles viewable by owners" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles viewable by members" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles insertable by owners" ON budget_cycles;

DROP POLICY IF EXISTS "Daily scores viewable by family based on role" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores insertable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores updatable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores deletable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores viewable by owners" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores viewable by self" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores insertable by owners" ON daily_scores;

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION is_family_owner(family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM families
    WHERE id = family_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Policies for families table
CREATE POLICY "Families - View Own" ON families
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Families - Insert Own" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Families - Update Own" ON families
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Families - Delete Own" ON families
  FOR DELETE USING (owner_id = auth.uid());

-- 2. Policies for family_members table
-- Owner access
CREATE POLICY "Family Members - Owner Full Access" ON family_members
  FOR ALL USING (is_family_owner(family_id));

-- Self-access (user can see and manage their own membership)
CREATE POLICY "Family Members - Self View" ON family_members
  FOR SELECT USING (user_id = auth.uid());

-- 3. Policies for family_settings table
-- Owner access
CREATE POLICY "Family Settings - Owner Full Access" ON family_settings
  FOR ALL USING (is_family_owner(family_id));

-- Member read access (no recursion because uses families table)
CREATE POLICY "Family Settings - Member View" ON family_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_id AND f.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_settings.family_id AND fm.user_id = auth.uid()
    )
  );

-- 4. Policies for budget_cycles table
-- Owner access
CREATE POLICY "Budget Cycles - Owner Full Access" ON budget_cycles
  FOR ALL USING (is_family_owner(family_id));

-- Member read access
CREATE POLICY "Budget Cycles - Member View" ON budget_cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = budget_cycles.family_id AND fm.user_id = auth.uid()
    )
  );

-- 5. Policies for daily_scores table
-- Owner access
CREATE POLICY "Daily Scores - Owner Full Access" ON daily_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.id = family_member_id AND f.owner_id = auth.uid()
    )
  );

-- Parent access (uses join to avoid recursion)
CREATE POLICY "Daily Scores - Parent Access" ON daily_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members target_fm
      JOIN family_members my_fm ON my_fm.family_id = target_fm.family_id
      WHERE target_fm.id = family_member_id
        AND my_fm.user_id = auth.uid()
        AND my_fm.role = 'parent'
    )
  );

-- Child self-view
CREATE POLICY "Daily Scores - Child Self View" ON daily_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = family_member_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'child'
    )
  );

-- Re-enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;

COMMIT;
