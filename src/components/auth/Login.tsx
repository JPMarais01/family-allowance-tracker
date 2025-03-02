import { Box, Button, Field, Heading, Input, Link, Text, VStack } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toaster } from '../../components/ui/toast-instance';
import { useAuth } from '../../context/useAuth';
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
        toaster.create({
          title: 'Success',
          description: 'Signed in successfully',
          type: 'success',
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
        <Heading size="lg">Sign In</Heading>

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
              placeholder="Enter your password"
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

        <Button
          colorScheme="blue"
          width="full"
          mt={4}
          type="submit"
          loading={isLoading}
          loadingText="Signing In"
          variant="solid"
          bg="blue.500"
          color="white"
          _hover={{ bg: 'blue.600' }}
        >
          Sign In
        </Button>

        <Text mt={2}>
          Don't have an account?{' '}
          <Link color="blue.500" onClick={() => navigate('/signup')}>
            Sign Up
          </Link>
        </Text>

        <Text>
          <Link color="blue.500" onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
