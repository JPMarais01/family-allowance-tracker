import React from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { Provider } from './components/ui/provider';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/auth-context';

// Auth Components
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ResetPassword } from './components/auth/ResetPassword';
import { SignUp } from './components/auth/SignUp';
import { Unauthorized } from './components/auth/Unauthorized';

// Placeholder for Dashboard (to be implemented later)
const Dashboard = (): React.ReactElement => <div>Dashboard (Coming Soon)</div>;

function App(): React.ReactElement {
  return (
    <Provider>
      <Toaster />
      <AuthProvider>
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

              {/* Catch All - Redirect to Login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
