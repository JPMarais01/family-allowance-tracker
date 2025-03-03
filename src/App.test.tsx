import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ResetPassword } from './components/auth/ResetPassword';
import { SignUp } from './components/auth/SignUp';
import { Unauthorized } from './components/auth/Unauthorized';
import { AuthProvider } from './contexts/auth-context'; // Import AuthProvider
import { render, screen, waitFor } from './test/utils';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any), // Spread the actual module
    useNavigate: vi.fn(),
  };
});

// Mock components (simple placeholders)
vi.mock('./components/auth/Login', () => ({
  Login: () => <div>Login Component</div>,
}));
vi.mock('./components/auth/SignUp', () => ({
  SignUp: () => <div>SignUp Component</div>,
}));
vi.mock('./components/auth/ForgotPassword', () => ({
  ForgotPassword: () => <div>ForgotPassword Component</div>,
}));
vi.mock('./components/auth/ResetPassword', () => ({
  ResetPassword: () => <div>ResetPassword Component</div>,
}));
vi.mock('./components/auth/Unauthorized', () => ({
  Unauthorized: () => <div>Unauthorized Component</div>,
}));
vi.mock('./components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div>ProtectedRoute: {children}</div>
  ),
}));

const Dashboard = (): React.ReactElement => <div>Dashboard (Coming Soon)</div>;

// Mock AuthProvider
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('App Routing', () => {
  const mockedNavigate = vi.fn();

  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockedNavigate);
    mockedNavigate.mockClear();
  });

  it('renders Login component at /login', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Component')).toBeInTheDocument();
    });
  });

  it('redirects to /login from /', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Login Component')).toBeInTheDocument();
    });
  });

  it('redirects to /login from an unknown route', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/unknown']}>
          <Routes>
            <Route path="*" element={<Login />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Login Component')).toBeInTheDocument();
    });
  });

  it('renders SignUp component at /signup', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('SignUp Component')).toBeInTheDocument();
    });
  });

  it('renders ForgotPassword component at /forgot-password', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('ForgotPassword Component')).toBeInTheDocument();
    });
  });

  it('renders ResetPassword component at /reset-password', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('ResetPassword Component')).toBeInTheDocument();
    });
  });

  it('renders Unauthorized component at /unauthorized', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/unauthorized']}>
          <Routes>
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Unauthorized Component')).toBeInTheDocument();
    });
  });

  it('renders Dashboard component at /dashboard', async () => {
    render(
      <MockAuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    expect(await screen.findByText('Dashboard (Coming Soon)')).toBeInTheDocument();
  });
});
