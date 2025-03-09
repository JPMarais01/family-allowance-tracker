BEGIN;

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Owner access
CREATE POLICY "Invitations - Owner Full Access" ON invitations
  FOR ALL USING (is_family_owner(family_id));

-- Creator access
CREATE POLICY "Invitations - Creator View" ON invitations
  FOR SELECT USING (created_by = auth.uid());

-- Family member access
CREATE POLICY "Invitations - Family Member View" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = invitations.family_id AND fm.user_id = auth.uid()
    )
  );

-- Parent create access
CREATE POLICY "Invitations - Parent Create" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = invitations.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );

-- Creator update access
CREATE POLICY "Invitations - Creator Update" ON invitations
  FOR UPDATE USING (created_by = auth.uid());

-- Create a function to validate invitation tokens
CREATE OR REPLACE FUNCTION validate_invitation_token(invitation_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM invitations
    WHERE token = invitation_token
    AND (used_at IS NULL)
    AND (expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public token access for anonymous users
CREATE POLICY "Invitations - Public Token Access Anon" ON invitations
  FOR SELECT TO anon
  USING (token = current_setting('request.invitation_token', true));

-- Public token access for authenticated users
CREATE POLICY "Invitations - Public Token Access Auth" ON invitations
  FOR SELECT TO authenticated
  USING (token = current_setting('request.invitation_token', true));

COMMIT;
