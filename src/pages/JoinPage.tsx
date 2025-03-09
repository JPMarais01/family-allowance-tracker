import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../hooks/use-toast';
import { handleAuthError } from '../lib/errorHandling';
import { supabase } from '../lib/supabase';
import { getInvitationByToken, markInvitationAsUsed } from '../services/InvitationService';

export function JoinPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        const invitationData = await getInvitationByToken(token);

        if (!invitationData) {
          setError('This invitation link is invalid or has expired.');
        } else {
          setInvitation(invitationData);
          // Pre-fill email if provided in the invitation
          if (invitationData.email) {
            setEmail(invitationData.email);
          }
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setError('An error occurred while validating your invitation.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSignUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: invitation.role },
        },
      });

      if (authError) {
        throw authError;
      }

      // Update the family member with the new user ID
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ user_id: authData.user?.id })
        .eq('id', invitation.family_member_id);

      if (updateError) {
        throw updateError;
      }

      // Mark invitation as used
      await markInvitationAsUsed(invitation.id);

      toast({
        title: 'Account created',
        description: 'Your account has been created and linked to your family.',
        variant: 'default',
      });

      // Redirect to the appropriate dashboard
      navigate(invitation.role === 'parent' ? '/dashboard' : '/kid-dashboard');
    } catch (err) {
      handleAuthError(err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto mt-8 p-6 border rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Invalid Invitation</h1>
        <p className="text-gray-500 mb-4">There was a problem with your invitation link.</p>
        <p className="text-red-500 mb-4">{error}</p>
        <Button className="w-full" onClick={() => navigate('/')}>
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto mt-8 p-6 border rounded-lg shadow-lg">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Join Your Family</h1>
        <p className="text-gray-500 mb-2">
          You've been invited to join as {invitation.family_members.name}(
          {invitation.family_members.role}).
        </p>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className={formErrors.email ? 'border-red-500' : ''}
          />
          {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium">
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={formErrors.password ? 'border-red-500' : ''}
          />
          {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-medium">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={formErrors.confirmPassword ? 'border-red-500' : ''}
          />
          {formErrors.confirmPassword && (
            <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
          )}
        </div>

        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account & Join'}
        </Button>
      </form>
    </div>
  );
}
