import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { handleAuthError } from '../../lib/errorHandling';
import { supabase } from '../../lib/supabase';

export function ResetPassword(): React.ReactElement {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the access token in the URL
    const { hash } = window.location;
    if (!hash || !hash.includes('access_token')) {
      toast({
        title: 'Error',
        description: 'Invalid or expired reset link',
        variant: 'destructive',
      });
      navigate('/forgot-password');
    }
  }, [navigate]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        handleAuthError(error);
      } else {
        setIsSuccess(true);
        toast({
          title: 'Success',
          description: 'Your password has been reset successfully',
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

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6 border rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>

        {isSuccess ? (
          <>
            <p className="text-center py-4">Your password has been reset successfully.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <p>Enter your new password below.</p>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className={passwordError ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-medium">
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={confirmPasswordError ? 'border-red-500' : ''}
              />
              {confirmPasswordError && (
                <p className="text-sm text-red-500">{confirmPasswordError}</p>
              )}
            </div>

            <Button className="w-full mt-4" type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
