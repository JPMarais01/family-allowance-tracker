import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/use-auth';
import { toast } from '../../hooks/use-toast';
import { handleAuthError } from '../../lib/errorHandling';

export function Login(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
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
      const { error } = await signIn(email, password);

      if (error) {
        handleAuthError(error);
      } else {
        toast({
          title: 'Success',
          description: 'Signed in successfully',
          variant: 'default',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      handleAuthError(error);
      console.error('Login error:', error);
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
        <h1 className="text-2xl font-bold">Sign In</h1>

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
              placeholder="Enter your password"
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

        <Button className="w-full mt-4" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <p className="mt-2 text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-blue-500 hover:underline"
          >
            Sign Up
          </button>
        </p>

        <p className="text-sm">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-blue-500 hover:underline"
          >
            Forgot Password?
          </button>
        </p>
      </form>
    </div>
  );
}
