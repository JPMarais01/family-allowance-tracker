BEGIN;

-- For families
CREATE POLICY "Families are deletable by owners"
    ON families FOR DELETE
    USING (auth.uid() = owner_id);

-- For family members
CREATE POLICY "Family members deletable by parents"
    ON family_members FOR DELETE
    USING (
        family_id IN (
            SELECT family_id FROM family_members
            WHERE user_id = auth.uid() AND role = 'parent'
        )
    );

-- For family settings
CREATE POLICY "Family settings deletable by parents"
    ON family_settings FOR DELETE
    USING (
        family_id IN (
            SELECT family_id FROM family_members
            WHERE user_id = auth.uid() AND role = 'parent'
        )
    );

-- For budget cycles
CREATE POLICY "Budget cycles deletable by parents"
    ON budget_cycles FOR DELETE
    USING (
        family_id IN (
            SELECT family_id FROM family_members
            WHERE user_id = auth.uid() AND role = 'parent'
        )
    );

COMMIT;