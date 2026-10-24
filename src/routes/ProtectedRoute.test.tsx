import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import { useAuth } from '@contexts/useAuth';
import { authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { ProtectedRoute } from './ProtectedRoute';

const student: AuthUser = {
  id: 'student-1',
  name: 'Jorge Amado',
  email: 'jorge@example.com',
  role: 'STUDENT',
};

const admin: AuthUser = { ...student, id: 'admin-1', role: 'ADMIN' };

const LocationProbe = () => {
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '';
  return <output>{`${location.pathname}|${returnTo}`}</output>;
};

const buildContext = (user: AuthUser | null, isRestoring = false): AuthContextValue => ({
  user,
  isAuthenticated: user !== null,
  isRestoring,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
});

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button type="button" onClick={logout}>
      Sair
    </button>
  );
};

const renderGuard = (context: AuthContextValue, path: string, allowedRoles: AuthUser['role'][]) =>
  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/meus-cursos" element={<LocationProbe />} />
          <Route
            path="*"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <p>Conteúdo protegido</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('redirects an anonymous user to login and preserves the original route', () => {
    renderGuard(buildContext(null), '/admin/cursos?tab=active', ['ADMIN']);

    expect(screen.getByText('/login|/admin/cursos?tab=active')).toBeInTheDocument();
  });

  it('redirects a user without permission to their own default panel', () => {
    renderGuard(buildContext(student), '/admin/cursos', ['ADMIN']);

    expect(screen.getByText('/meus-cursos|')).toBeInTheDocument();
  });

  it('renders the requested route for a permitted profile', () => {
    renderGuard(buildContext(admin), '/admin/cursos', ['ADMIN']);

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('waits for session restoration before redirecting', () => {
    renderGuard(buildContext(null, true), '/admin/cursos', ['ADMIN']);

    expect(screen.getByRole('status', { name: 'Restaurando sessão' })).toBeInTheDocument();
    expect(screen.queryByText('/login|/admin/cursos')).not.toBeInTheDocument();
  });

  it('keeps the current route as returnTo when the session ends without navigating (e.g. expired token)', async () => {
    const user = userEvent.setup();
    localStorage.setItem('access_token', 'jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(student);

    render(
      <MemoryRouter initialEntries={['/meus-cursos']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LocationProbe />} />
            <Route
              path="/meus-cursos"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <LogoutButton />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(screen.getByText('/login|/meus-cursos')).toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
