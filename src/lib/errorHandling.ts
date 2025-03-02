import { toaster } from '../components/ui/toast-instance';

// Error message mapping
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'The email or password you entered is incorrect.',
  'Email not confirmed': 'Please verify your email address before logging in.',
  'Email already in use': 'An account with this email already exists.',
  'Password should be at least 6 characters':
    'Please use a stronger password with at least 8 characters.',
  'Rate limit exceeded': 'Too many attempts. Please try again later.',
};

/**
 * Handles authentication errors consistently across the application
 * @param error The error object from Supabase or other sources
 * @param fallbackMessage Optional fallback message if no mapping exists
 */
export function handleAuthError(
  error: any,
  fallbackMessage = 'An unexpected error occurred'
): void {
  if (!error) {
    return;
  }

  // Get the error message
  const errorMessage = error.message || '';

  // Log all errors to console for collection during development
  console.error('Error:', {
    originalMessage: errorMessage,
    errorObject: error,
    errorCode: error.code,
    status: error.status,
  });

  // Find a match or use fallback
  const userFriendlyMessage = errorMessages[errorMessage] || fallbackMessage;

  // Display toast
  toaster.create({
    title: 'Error',
    description: userFriendlyMessage,
    type: 'error',
  });
}
