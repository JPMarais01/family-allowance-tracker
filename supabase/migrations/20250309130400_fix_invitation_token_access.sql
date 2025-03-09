BEGIN;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Invitations - Public Token Access Anon" ON invitations;
DROP POLICY IF EXISTS "Invitations - Public Token Access Auth" ON invitations;

-- Create a function to get invitation by token
CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token TEXT)
RETURNS TABLE (
  id UUID,
  family_id UUID,
  family_member_id UUID,
  token TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_by UUID,
  member_name TEXT,
  member_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.*, fm.name as member_name, fm.role as member_role
  FROM invitations i
  JOIN family_members fm ON i.family_member_id = fm.id
  WHERE i.token = invitation_token
  AND i.used_at IS NULL
  AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
