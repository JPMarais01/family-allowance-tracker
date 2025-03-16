import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { Provider } from './components/ui/provider';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './hooks/use-auth';
import { useFamilyStore } from './stores/FamilyStore';
import { useUserStore } from './stores/UserStore';

// Auth Components
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ResetPassword } from './components/auth/ResetPassword';
import { SignUp } from './components/auth/SignUp';
import { Unauthorized } from './components/auth/Unauthorized';

// Dashboard Component
import { Dashboard } from './components/Dashboard';
import { JoinPage } from './pages/JoinPage';

function AppRoutes(): React.ReactElement {
  const { user } = useAuth();
  const { setUser } = useUserStore();
  const { initialize } = useFamilyStore();

  // Initialize user state and then family store
  useEffect(() => {
    // First set the user
    setUser(user);

    // Then initialize family store
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [user, setUser, initialize]);

  return (
    <Router>
      <div style={{ width: '100%', maxWidth: '100vw' }}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Route - Redirect to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Join Route */}
          <Route path="/join" element={<JoinPage />} />

          {/* Catch All - Redirect to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App(): React.ReactElement {
  return (
    <Provider>
      <Toaster />
      <AppRoutes />
    </Provider>
  );
}

export default App;
