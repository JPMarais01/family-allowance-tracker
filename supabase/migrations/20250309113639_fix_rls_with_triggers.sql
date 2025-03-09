BEGIN;

-- 1. First, disable RLS temporarily to make changes safely
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on these tables
DROP POLICY IF EXISTS "Family members viewable by family members" ON family_members;
DROP POLICY IF EXISTS "Family members insertable by parents" ON family_members;
DROP POLICY IF EXISTS "Family members deletable by parents" ON family_members;

DROP POLICY IF EXISTS "Family settings viewable by family members" ON family_settings;
DROP POLICY IF EXISTS "Family settings editable by family parents" ON family_settings;
DROP POLICY IF EXISTS "Family settings deletable by parents" ON family_settings;

DROP POLICY IF EXISTS "Budget cycles viewable by family members" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles insertable by family parents" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles deletable by parents" ON budget_cycles;

DROP POLICY IF EXISTS "Daily scores viewable by family based on role" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores insertable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores updatable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores deletable by family parents" ON daily_scores;

-- 3. Create simplified, non-recursive policies for family_members
CREATE POLICY "Family members viewable by owners"
    ON family_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_members.family_id
            AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "Family members viewable by self"
    ON family_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Family members viewable by family"
    ON family_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE f.id = family_members.family_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Family members insertable by owners"
    ON family_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "Family members deletable by owners"
    ON family_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND f.owner_id = auth.uid()
        )
    );

-- 4. Create simplified policies for family_settings
CREATE POLICY "Family settings viewable by owners"
    ON family_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_settings.family_id
            AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "Family settings viewable by members"
    ON family_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE f.id = family_settings.family_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Family settings editable by owners"
    ON family_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_settings.family_id
            AND f.owner_id = auth.uid()
        )
    );

-- 5. Create simplified policies for budget_cycles
CREATE POLICY "Budget cycles viewable by owners"
    ON budget_cycles FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = budget_cycles.family_id
            AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "Budget cycles viewable by members"
    ON budget_cycles FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE f.id = budget_cycles.family_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Budget cycles insertable by owners"
    ON budget_cycles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND f.owner_id = auth.uid()
        )
    );

-- 6. Create simplified policies for daily_scores
CREATE POLICY "Daily scores viewable by owners"
    ON daily_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM family_members fm
            JOIN families f ON f.id = fm.family_id
            WHERE fm.id = daily_scores.family_member_id
            AND f.owner_id = auth.uid()
        )
    );

CREATE POLICY "Daily scores viewable by self"
    ON daily_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM family_members fm
            WHERE fm.id = daily_scores.family_member_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Daily scores insertable by owners"
    ON daily_scores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM family_members fm
            JOIN families f ON f.id = fm.family_id
            WHERE fm.id = family_member_id
            AND f.owner_id = auth.uid()
        )
    );

-- 7. Re-enable RLS on all tables
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;

COMMIT;
