import { Center, Spinner } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string | string[];
};

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps): React.ReactElement {
  const { user, familyMember, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role check is required
  if (requiredRole) {
    // For multiple allowed roles
    if (Array.isArray(requiredRole)) {
      if (!familyMember.role || !requiredRole.includes(familyMember.role)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
    // For single required role
    else if (!familyMember.role || familyMember.role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
}
