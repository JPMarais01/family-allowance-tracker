import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import {
  checkInvitationForMember,
  createInvitation,
  getExpiredInvitationsForMember,
  regenerateExpiredToken,
} from '../../services/InvitationService';
import { toast } from '../../hooks/use-toast';
import { render } from '../../test/utils';
import { InviteMember } from './InviteMember';

// Mock the toast
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the invitation service
vi.mock('../../services/InvitationService', () => ({
  checkInvitationForMember: vi.fn(),
  createInvitation: vi.fn(),
  getExpiredInvitationsForMember: vi.fn(),
  regenerateExpiredToken: vi.fn(),
}));

describe('InviteMember Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks return no invitations
    (checkInvitationForMember as jest.Mock).mockResolvedValue(null);
    (getExpiredInvitationsForMember as jest.Mock).mockResolvedValue([]);
  });

  it('renders invite button', () => {
    render(<InviteMember memberId="123" memberName="Test Member" />);
    expect(screen.getByText('Invite')).toBeInTheDocument();
  });

  it('opens modal when invite button is clicked', async () => {
    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Click invite button
    fireEvent.click(screen.getByText('Invite'));
    
    // Modal should be open with the member name
    await waitFor(() => {
      expect(screen.getByText('Invite Test Member')).toBeInTheDocument();
    });
  });

  it('creates a new invitation when no existing invitations', async () => {
    // Mock createInvitation to return a link
    (createInvitation as jest.Mock).mockResolvedValue('http://example.com/join?token=123');

    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Open modal
    fireEvent.click(screen.getByText('Invite'));
    
    // Wait for invitation check to complete
    await waitFor(() => {
      expect(screen.getByText('Create Invitation')).toBeInTheDocument();
    });
    
    // Create invitation
    fireEvent.click(screen.getByText('Create Invitation'));
    
    // Wait for invitation to be created
    await waitFor(() => {
      expect(createInvitation).toHaveBeenCalledWith('123', '');
      expect(screen.getByDisplayValue('http://example.com/join?token=123')).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith({
        title: 'Invitation created',
        description: 'The invitation link has been generated successfully.',
        variant: 'default',
      });
    });
  });

  it('shows existing invitation when one is active', async () => {
    // Mock an existing invitation
    (checkInvitationForMember as jest.Mock).mockResolvedValue('http://example.com/join?token=abc');

    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Open modal
    fireEvent.click(screen.getByText('Invite'));
    
    // The component automatically shows the link when an existing one is found
    // Just verify the link is shown
    await waitFor(() => {
      expect(screen.getByDisplayValue('http://example.com/join?token=abc')).toBeInTheDocument();
    });
  });

  it('shows option to regenerate an expired invitation', async () => {
    // Mock an expired invitation
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 2); // 2 days ago
    
    (getExpiredInvitationsForMember as jest.Mock).mockResolvedValue([{
      id: '456',
      family_member_id: '123',
      token: 'expired-token',
      expires_at: expiredDate.toISOString(),
      created_at: new Date().toISOString(),
      family_id: 'fam123',
      role: 'child',
      created_by: 'user123'
    }]);

    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Open modal
    fireEvent.click(screen.getByText('Invite'));
    
    // Wait for invitation checks to complete
    await waitFor(() => {
      expect(screen.getByText(/This family member has an expired invitation from/)).toBeInTheDocument();
      expect(screen.getByText('Regenerate Invitation Link')).toBeInTheDocument();
    });
  });

  it('regenerates an expired token successfully', async () => {
    // Mock an expired invitation
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 2); // 2 days ago
    
    (getExpiredInvitationsForMember as jest.Mock).mockResolvedValue([{
      id: '456',
      family_member_id: '123',
      token: 'expired-token',
      expires_at: expiredDate.toISOString(),
      created_at: new Date().toISOString(),
      family_id: 'fam123',
      role: 'child',
      created_by: 'user123'
    }]);
    
    // Mock successful token regeneration
    (regenerateExpiredToken as jest.Mock).mockResolvedValue('http://example.com/join?token=new-token');

    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Open modal
    fireEvent.click(screen.getByText('Invite'));
    
    // Wait for invitation checks to complete
    await waitFor(() => {
      expect(screen.getByText(/This family member has an expired invitation from/)).toBeInTheDocument();
    });
    
    // Regenerate the token
    fireEvent.click(screen.getByText('Regenerate Invitation Link'));
    
    // Wait for regeneration to complete
    await waitFor(() => {
      expect(regenerateExpiredToken).toHaveBeenCalledWith('456');
      expect(screen.getByDisplayValue('http://example.com/join?token=new-token')).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith({
        title: 'Invitation Renewed',
        description: 'The invitation link has been regenerated successfully.',
        variant: 'default',
      });
    });
  });

  it('handles token regeneration failure', async () => {
    // Mock an expired invitation
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 2); // 2 days ago
    
    (getExpiredInvitationsForMember as jest.Mock).mockResolvedValue([{
      id: '456',
      family_member_id: '123',
      token: 'expired-token',
      expires_at: expiredDate.toISOString(),
      created_at: new Date().toISOString(),
      family_id: 'fam123',
      role: 'child',
      created_by: 'user123'
    }]);
    
    // Mock token regeneration failure
    (regenerateExpiredToken as jest.Mock).mockResolvedValue(null);

    render(<InviteMember memberId="123" memberName="Test Member" />);
    
    // Open modal
    fireEvent.click(screen.getByText('Invite'));
    
    // Wait for invitation checks to complete
    await waitFor(() => {
      expect(screen.getByText(/This family member has an expired invitation from/)).toBeInTheDocument();
    });
    
    // Regenerate the token
    fireEvent.click(screen.getByText('Regenerate Invitation Link'));
    
    // Wait for regeneration to complete
    await waitFor(() => {
      expect(regenerateExpiredToken).toHaveBeenCalledWith('456');
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to regenerate invitation link.',
        variant: 'destructive',
      });
    });
  });
});