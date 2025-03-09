BEGIN;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Family members viewable by family members" ON family_members;

-- Create a new non-recursive policy
CREATE POLICY "Family members viewable by family members"
    ON family_members FOR SELECT
    USING (
        -- A user can see their own record
        user_id = auth.uid()
        OR
        -- A user can see records from families they belong to
        EXISTS (
            SELECT 1
            FROM family_members AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.family_id = family_members.family_id
        )
    );

COMMIT;
