import { Box, Button, Field, Heading, Input, Link, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { toaster } from '../ui/toast-instance';

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
        toaster.create({
          title: 'Error',
          description: error.message || 'Failed to send reset link',
          type: 'error',
        });
      } else {
        setIsSubmitted(true);
        toaster.create({
          title: 'Success',
          description: 'Password reset link sent to your email',
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

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack gap={4} as="form" onSubmit={handleSubmit}>
        <Heading size="lg">Reset Password</Heading>

        {isSubmitted ? (
          <>
            <Text textAlign="center" py={4}>
              We've sent a password reset link to your email. Please check your inbox.
            </Text>
            <Button colorScheme="blue" width="full" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <Text>Enter your email address and we'll send you a link to reset your password.</Text>

            <Field.Root invalid={!!emailError} required>
              <Field.Label>Email</Field.Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
              {emailError && <Field.ErrorText>{emailError}</Field.ErrorText>}
            </Field.Root>

            <Button
              colorScheme="blue"
              width="full"
              mt={4}
              type="submit"
              loading={isLoading}
              loadingText="Sending"
            >
              Send Reset Link
            </Button>

            <Text mt={2}>
              <Link color="blue.500" onClick={() => navigate('/login')}>
                Back to Login
              </Link>
            </Text>
          </>
        )}
      </VStack>
    </Box>
  );
}
