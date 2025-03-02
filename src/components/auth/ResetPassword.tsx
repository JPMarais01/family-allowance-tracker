import { Box, Button, Field, Heading, Input, Text, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toaster } from '../ui/toast-instance';

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
      toaster.create({
        title: 'Error',
        description: 'Invalid or expired reset link',
        type: 'error',
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
        toaster.create({
          title: 'Error',
          description: error.message || 'Failed to reset password',
          type: 'error',
        });
      } else {
        setIsSuccess(true);
        toaster.create({
          title: 'Success',
          description: 'Your password has been reset successfully',
          type: 'success',
        });
      }
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error',
      });
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack gap={4} as="form" onSubmit={handleSubmit}>
        <Heading size="lg">Reset Your Password</Heading>

        {isSuccess ? (
          <>
            <Text textAlign="center" py={4}>
              Your password has been reset successfully.
            </Text>
            <Button colorScheme="blue" width="full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <Text>Enter your new password below.</Text>

            <Field.Root invalid={!!passwordError} required>
              <Field.Label>New Password</Field.Label>
              <Box position="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  pr="4.5rem"
                />
                <Button
                  h="1.75rem"
                  size="sm"
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </Box>
              {passwordError && <Field.ErrorText>{passwordError}</Field.ErrorText>}
            </Field.Root>

            <Field.Root invalid={!!confirmPasswordError} required>
              <Field.Label>Confirm New Password</Field.Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
              {confirmPasswordError && <Field.ErrorText>{confirmPasswordError}</Field.ErrorText>}
            </Field.Root>

            <Button
              colorScheme="blue"
              width="full"
              mt={4}
              type="submit"
              loading={isLoading}
              loadingText="Resetting Password"
            >
              Reset Password
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
