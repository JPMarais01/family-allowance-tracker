import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/use-auth';
import { toast } from '../../hooks/use-toast';
import { handleAuthError } from '../../lib/errorHandling';

export function ForgotPassword(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        handleAuthError(error);
      } else {
        setIsSubmitted(true);
        toast({
          title: 'Success',
          description: 'Password reset link sent to your email',
          variant: 'default',
        });
      }
    } catch (error) {
      handleAuthError(error);
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-8 p-6 border rounded-lg shadow-lg">
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <h1 className="text-2xl font-bold">Reset Password</h1>

          <p className="text-gray-500">
            Enter your email address and we'll send you a link to reset your password.
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
              className={emailError ? 'border-red-500' : ''}
            />
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>

          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <p className="mt-2 text-sm">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-500 hover:underline"
            >
              Back to Login
            </button>
          </p>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Check Your Email</h1>

          <p className="text-gray-500">
            If an account exists for {email}, we've sent a password reset link to this email
            address.
          </p>

          <Button className="w-full mt-4" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
}
