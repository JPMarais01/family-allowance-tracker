BEGIN;

-- 1. Drop all potentially recursive policies
DROP POLICY IF EXISTS "Family members viewable by family members" ON family_members;
DROP POLICY IF EXISTS "Family settings viewable by family members" ON family_settings;
DROP POLICY IF EXISTS "Family settings editable by family parents" ON family_settings;
DROP POLICY IF EXISTS "Budget cycles viewable by family members" ON budget_cycles;
DROP POLICY IF EXISTS "Budget cycles insertable by family parents" ON budget_cycles;
DROP POLICY IF EXISTS "Daily scores viewable by family based on role" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores insertable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores updatable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Daily scores deletable by family parents" ON daily_scores;
DROP POLICY IF EXISTS "Family members deletable by parents" ON family_members;
DROP POLICY IF EXISTS "Family settings deletable by parents" ON family_settings;
DROP POLICY IF EXISTS "Budget cycles deletable by parents" ON budget_cycles;

-- 2. Create non-recursive family_members policies
CREATE POLICY "Family members viewable by family members"
    ON family_members FOR SELECT
    USING (
        -- A user can see their own record
        user_id = auth.uid()
        OR
        -- A user can see family members from families they belong to
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_members.family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Family members insertable by parents"
    ON family_members FOR INSERT
    WITH CHECK (
        -- Only family owners or parents can add members
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

CREATE POLICY "Family members deletable by parents"
    ON family_members FOR DELETE
    USING (
        -- Only family owners or parents can delete members
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

-- 3. Create non-recursive family_settings policies
CREATE POLICY "Family settings viewable by family members"
    ON family_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_settings.family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Family settings editable by family parents"
    ON family_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_settings.family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

CREATE POLICY "Family settings deletable by parents"
    ON family_settings FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_settings.family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

-- 4. Create non-recursive budget_cycles policies
CREATE POLICY "Budget cycles viewable by family members"
    ON budget_cycles FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = budget_cycles.family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Budget cycles insertable by family parents"
    ON budget_cycles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

CREATE POLICY "Budget cycles deletable by parents"
    ON budget_cycles FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM families f
            WHERE f.id = family_id
            AND (
                f.owner_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1
                    FROM family_members fm
                    WHERE fm.family_id = f.id
                    AND fm.user_id = auth.uid()
                    AND fm.role = 'parent'
                )
            )
        )
    );

-- 5. Create non-recursive daily_scores policies
CREATE POLICY "Daily scores viewable by family based on role"
    ON daily_scores FOR SELECT
    USING (
        -- Parents can see all scores for their family
        EXISTS (
            SELECT 1
            FROM family_members fm
            JOIN families f ON f.id = fm.family_id
            JOIN family_members target_fm ON target_fm.id = daily_scores.family_member_id
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'parent'
            AND target_fm.family_id = fm.family_id
        )
        OR
        -- Children can only see their own scores
        EXISTS (
            SELECT 1
            FROM family_members fm
            WHERE fm.id = daily_scores.family_member_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'child'
        )
    );

CREATE POLICY "Daily scores insertable by family parents"
    ON daily_scores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM family_members target_fm
            JOIN family_members fm ON fm.family_id = target_fm.family_id
            WHERE target_fm.id = family_member_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'parent'
        )
    );

CREATE POLICY "Daily scores updatable by family parents"
    ON daily_scores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM family_members target_fm
            JOIN family_members fm ON fm.family_id = target_fm.family_id
            WHERE target_fm.id = family_member_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'parent'
        )
    );

CREATE POLICY "Daily scores deletable by family parents"
    ON daily_scores FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM family_members target_fm
            JOIN family_members fm ON fm.family_id = target_fm.family_id
            WHERE target_fm.id = family_member_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'parent'
        )
    );

COMMIT;
