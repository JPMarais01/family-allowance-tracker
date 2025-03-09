import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/spinner';
import { useAuth } from '../../hooks/use-auth';

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
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role check is required
  if (requiredRole) {
    // If familyMember is null, redirect to unauthorized
    if (!familyMember) {
      return <Navigate to="/unauthorized" replace />;
    }

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
