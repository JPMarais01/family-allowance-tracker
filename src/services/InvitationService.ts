import { supabase } from '../lib/supabase';

export interface Invitation {
  id: string;
  family_id: string;
  family_member_id: string;
  token: string;
  email?: string;
  role: 'parent' | 'child';
  created_at: string;
  expires_at: string;
  used_at?: string;
  created_by: string;
  family_members?: {
    name: string;
    role: string;
  };
}

export async function createInvitation(
  familyMemberId: string,
  email?: string
): Promise<string | null> {
  try {
    // Get family member details
    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('id', familyMemberId)
      .single();

    if (memberError) {
      throw memberError;
    }

    // Generate a secure random token
    const token = crypto.randomUUID();

    // Set expiration (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Store the invitation
    const { error: inviteError } = await supabase.from('invitations').insert({
      family_id: memberData.family_id,
      family_member_id: familyMemberId,
      token,
      email,
      role: memberData.role,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    });

    if (inviteError) {
      throw inviteError;
    }

    // Return the invitation link
    return `${window.location.origin}/join?token=${token}`;
  } catch (error) {
    console.error('Error creating invitation:', error);
    return null;
  }
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  try {
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
      invitation_token: token,
    });

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      return null;
    }

    // Transform the data to match your expected format
    const invitation = data[0];
    return {
      id: invitation.id,
      family_id: invitation.family_id,
      family_member_id: invitation.family_member_id,
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      created_at: invitation.created_at,
      expires_at: invitation.expires_at,
      used_at: invitation.used_at,
      created_by: invitation.created_by,
      family_members: {
        name: invitation.member_name,
        role: invitation.member_role,
      },
    };
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return null;
  }
}

export async function markInvitationAsUsed(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    return false;
  }
}

export async function checkInvitationForMember(memberId: string): Promise<string | null> {
  try {
    // Query the invitations table for active invitations for this member
    const { data, error } = await supabase
      .from('invitations')
      .select('token')
      .eq('family_member_id', memberId)
      .is('used_at', null) // Only get unused invitations
      .gt('expires_at', new Date().toISOString()) // Only get non-expired invitations
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking invitation:', error);
      return null;
    }

    // If an active invitation exists, construct and return the invitation link
    if (data && data.length > 0) {
      // Construct the invitation link using the token
      // This should match how you construct links in createInvitation
      const baseUrl = window.location.origin;
      return `${baseUrl}/join?token=${data[0].token}`;
    }

    return null;
  } catch (error) {
    console.error('Error checking invitation:', error);
    return null;
  }
}

export async function getExpiredInvitationsForMember(
  memberId: string
): Promise<Invitation[]> {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_member_id', memberId)
      .is('used_at', null) // Only get unused invitations
      .lt('expires_at', new Date().toISOString()) // Only get expired invitations
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching expired invitations:', error);
    return [];
  }
}

export async function regenerateExpiredToken(
  invitationId: string
): Promise<string | null> {
  try {
    // Generate a new secure random token
    const token = crypto.randomUUID();
    
    // Set new expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Update the invitation with the new token and expiration
    const { error } = await supabase
      .from('invitations')
      .update({ 
        token,
        expires_at: expiresAt.toISOString() 
      })
      .eq('id', invitationId)
      .is('used_at', null); // Only update if not used
    
    if (error) {
      throw error;
    }
    
    // Return the new invitation link
    return `${window.location.origin}/join?token=${token}`;
  } catch (error) {
    console.error('Error regenerating invitation token:', error);
    return null;
  }
}
