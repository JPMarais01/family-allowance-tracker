import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/use-auth';
import { toast } from '../../hooks/use-toast';
import { handleAuthError } from '../../lib/errorHandling';

export function SignUp(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    }

    // Validate password with stronger requirements
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
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
      const { error } = await signUp(email, password);

      if (error) {
        handleAuthError(error);
      } else {
        toast({
          title: 'Success',
          description: 'Check your email for the confirmation link',
          variant: 'default',
        });
        navigate('/login');
      }
    } catch (error) {
      handleAuthError(error);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-8 p-6 border rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Create Account</h1>

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

        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
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
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className={confirmPasswordError ? 'border-red-500' : ''}
          />
          {confirmPasswordError && <p className="text-sm text-red-500">{confirmPasswordError}</p>}
        </div>

        <Button className="w-full mt-4" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <p className="mt-2 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-500 hover:underline"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}
