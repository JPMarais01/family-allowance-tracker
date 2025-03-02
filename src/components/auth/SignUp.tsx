import { Box, Button, Field, Heading, Input, Link, Text, VStack } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { toaster } from '../ui/toast-instance';

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
      const { error } = await signUp(email, password);

      if (error) {
        toaster.create({
          title: 'Error',
          description: error.message || 'Failed to sign up',
          type: 'error',
        });
      } else {
        toaster.create({
          title: 'Success',
          description: 'Check your email for the confirmation link',
          type: 'success',
        });
        navigate('/login');
      }
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error',
      });
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      width={{ base: '90%', sm: '80%', md: '70%', lg: '60%', xl: '50%' }}
      minW="md"
      maxW="lg"
      mx="auto"
      mt={8}
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack gap={4} as="form" onSubmit={handleSubmit} width="100%" align="stretch">
        <Heading size="lg">Create Account</Heading>

        <Field.Root invalid={!!emailError} required>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            width="100%"
          />
          {emailError && <Field.ErrorText>{emailError}</Field.ErrorText>}
        </Field.Root>

        <Field.Root invalid={!!passwordError} required width="100%">
          <Field.Label>Password</Field.Label>
          <Box position="relative" width="100%">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              pr="4.5rem"
              width="100%"
            />
            <Button
              h="1.75rem"
              size="xs"
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
              onClick={toggleShowPassword}
              variant="ghost"
              px={2}
              minW="auto"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </Box>
          {passwordError && <Field.ErrorText>{passwordError}</Field.ErrorText>}
        </Field.Root>

        <Field.Root invalid={!!confirmPasswordError} required width="100%">
          <Field.Label>Confirm Password</Field.Label>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            width="100%"
          />
          {confirmPasswordError && <Field.ErrorText>{confirmPasswordError}</Field.ErrorText>}
        </Field.Root>

        <Button
          colorScheme="blue"
          width="full"
          mt={4}
          type="submit"
          loading={isLoading}
          loadingText="Creating Account"
          variant="solid"
          bg="blue.500"
          color="white"
          _hover={{ bg: 'blue.600' }}
        >
          Sign Up
        </Button>

        <Text mt={2}>
          Already have an account?{' '}
          <Link color="blue.500" onClick={() => navigate('/login')}>
            Sign In
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
