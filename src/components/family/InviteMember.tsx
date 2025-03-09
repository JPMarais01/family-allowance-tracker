import { Copy } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { checkInvitationForMember, createInvitation } from '../../services/InvitationService';
import { Button } from '../ui/button';

interface InviteMemberProps {
  memberId: string;
  memberName: string;
}

export function InviteMember({ memberId, memberName }: InviteMemberProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [existingInvitation, setExistingInvitation] = useState<string | null>(null);
  const [checkingInvitation, setCheckingInvitation] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Check for existing invitation when modal opens
  useEffect(() => {
    async function checkExistingInvitation() {
      if (isOpen) {
        setCheckingInvitation(true);
        try {
          // We'll need to implement this function in InvitationService
          const existingLink = await checkInvitationForMember(memberId);
          if (existingLink) {
            setExistingInvitation(existingLink);
            setInvitationLink(existingLink);
          }
        } catch (error) {
          console.error('Error checking existing invitation:', error);
          toast({
            title: 'Error',
            description: 'Failed to check for existing invitations.',
            variant: 'destructive',
          });
        } finally {
          setCheckingInvitation(false);
        }
      }
    }

    checkExistingInvitation();
  }, [isOpen, memberId]);

  const handleInvite = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // If there's an existing invitation, use that instead of creating a new one
      if (existingInvitation) {
        setInvitationLink(existingInvitation);
        toast({
          title: 'Existing invitation found',
          description: 'Using the existing invitation link for this member.',
          variant: 'default',
        });
      } else {
        const link = await createInvitation(memberId, email);
        if (link) {
          setInvitationLink(link);
          toast({
            title: 'Invitation created',
            description: 'The invitation link has been generated successfully.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create invitation link.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (): Promise<void> => {
    if (invitationLink) {
      try {
        await navigator.clipboard.writeText(invitationLink);
        toast({
          title: 'Copied',
          description: 'Invitation link copied to clipboard',
          variant: 'default',
        });
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const resetAndClose = (): void => {
    setIsOpen(false);
    setInvitationLink(null);
    setEmail('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
        Invite
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md"
          >
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Invite {memberName}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {invitationLink
                  ? 'Share this invitation link with your family member.'
                  : existingInvitation
                    ? 'This member already has an active invitation.'
                    : 'Create an invitation link for this family member to join.'}
              </p>
            </div>

            {/* Content */}
            <div className="p-4">
              {checkingInvitation ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                  <span className="ml-2">Checking for existing invitations...</span>
                </div>
              ) : invitationLink ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        readOnly
                        value={invitationLink}
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    This link will expire in 7 days. The recipient will be able to create an account
                    and join your family.
                  </p>
                </div>
              ) : existingInvitation ? (
                <div className="space-y-4">
                  <p className="text-amber-600 dark:text-amber-400">
                    An active invitation already exists for this family member.
                  </p>
                  <Button onClick={() => setInvitationLink(existingInvitation)} className="w-full">
                    View Existing Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="family.member@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      You can optionally provide their email address for tracking purposes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end space-x-2">
              {invitationLink ? (
                <Button variant="outline" onClick={resetAndClose}>
                  Close
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvite}
                    disabled={isLoading || checkingInvitation || !!existingInvitation}
                  >
                    {isLoading
                      ? 'Creating...'
                      : existingInvitation
                        ? 'View Invitation'
                        : 'Create Invitation'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
