BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)

-- Families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Family members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  base_allowance NUMERIC(10,2) DEFAULT 0, -- Only relevant for children
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family settings table
CREATE TABLE family_settings (
    family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
    budget_cycle_start_day INTEGER NOT NULL DEFAULT 25 CHECK (budget_cycle_start_day BETWEEN 1 AND 28),
    vacation_default_score INTEGER DEFAULT 3 CHECK (vacation_default_score >= 1 AND vacation_default_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget cycles table
CREATE TABLE budget_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date > start_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily scores table
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  budget_cycle_id UUID REFERENCES budget_cycles(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  date DATE NOT NULL,
  is_vacation BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_member_id, date)
);

-- Row level security policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;

-- Policies for families
CREATE POLICY "Families are viewable by owners"
    ON families FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Families are insertable by authenticated users"
    ON families FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Families are updatable by owners"
    ON families FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Family members viewable by family members"
    ON family_members FOR SELECT
    USING (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family settings viewable by family members"
    ON family_settings FOR SELECT
    USING (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family settings editable by family parents"
    ON family_settings FOR UPDATE
    USING (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'parent'
        )
    );

CREATE POLICY "Budget cycles viewable by family members"
    ON budget_cycles FOR SELECT
    USING (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget cycles insertable by family parents"
    ON budget_cycles FOR INSERT
    WITH CHECK (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'parent'
        )
    );

CREATE POLICY "Daily scores viewable by family based on role"
    ON daily_scores FOR SELECT
    USING (
        -- Parents can see all scores for their family
        EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.user_id = auth.uid()
        AND fm.role = 'parent'
        AND fm.family_id = (
            SELECT family_id FROM family_members WHERE id = family_member_id
        )
        )
        OR
        -- Children can only see their own scores
        family_member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid() AND role = 'child'
        )
    );

CREATE POLICY "Daily scores insertable by family parents"
    ON daily_scores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'parent'
            AND fm.family_id = (
                SELECT family_id FROM family_members WHERE id = family_member_id
            )
        )
    );

CREATE POLICY "Daily scores updatable by family parents"
    ON daily_scores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'parent'
            AND fm.family_id = (
                SELECT family_id FROM family_members WHERE id = family_member_id
            )
        )
    );

-- Add delete policy for daily scores
CREATE POLICY "Daily scores deletable by family parents"
    ON daily_scores FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'parent'
            AND fm.family_id = (
                SELECT family_id FROM family_members WHERE id = family_member_id
            )
        )
    );

-- Add indexes for common queries
CREATE INDEX idx_daily_scores_date ON daily_scores(date);
CREATE INDEX idx_daily_scores_member_date ON daily_scores(family_member_id, date);
CREATE INDEX idx_family_members_role ON family_members(family_id, role);

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON families
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating timestamp
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON family_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating timestamp
CREATE TRIGGER update_family_settings_updated_at
BEFORE UPDATE ON family_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating timestamp
CREATE TRIGGER update_budget_cycles_updated_at
BEFORE UPDATE ON budget_cycles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating timestamp
CREATE TRIGGER update_daily_scores_updated_at
BEFORE UPDATE ON daily_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;