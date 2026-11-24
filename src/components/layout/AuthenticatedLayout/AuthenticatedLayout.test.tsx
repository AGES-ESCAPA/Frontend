import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ProtectedRoute } from '@routes/ProtectedRoute';
import { authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthenticatedLayout } from './AuthenticatedLayout';

vi.mock('@hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

const student: AuthUser = {
  id: 'b1',
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  role: 'STUDENT',
};

const employee: AuthUser = {
  ...student,
  id: 'e1',
  role: 'EMPLOYEE',
};

const LocationProbe = () => {
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? 'sem returnTo';
  return <output>{`${location.pathname}|${returnTo}`}</output>;
};

const renderLayout = (onLogout = vi.fn()) => {
  localStorage.setItem('access_token', 'jwt-token');
  vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(student);

  render(
    <MemoryRouter initialEntries={['/meu-perfil']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/meu-perfil"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <AuthenticatedLayout
                  role="student"
                  items={[]}
                  user={{ name: '', role: '' }}
                  onLogout={onLogout}
                >
                  <p>Conteúdo</p>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('AuthenticatedLayout', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('hides the public catalog from the sidebar of a company employee', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(employee);

    render(
      <MemoryRouter initialEntries={['/meus-cursos']}>
        <AuthProvider>
          <AuthenticatedLayout
            role="student"
            items={[
              { icon: null, label: 'Cursos', route: '/aluno/cursos' },
              { icon: null, label: 'Meus Cursos', route: '/meus-cursos', active: true },
              { icon: null, label: 'Meu Perfil', route: '/meu-perfil' },
            ]}
            user={{ name: '', role: '' }}
          >
            <p>Conteúdo</p>
          </AuthenticatedLayout>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Meus Cursos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Meu Perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cursos' })).not.toBeInTheDocument();
  });

  it('ends the session and goes to the login without returnTo when signing out from the sidebar', async () => {
    const onLogout = vi.fn();
    renderLayout(onLogout);

    await userEvent.click(await screen.findByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByText('/login|sem returnTo')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
    // Com AuthProvider, o layout encerra a sessão sozinho e não delega ao onLogout da página.
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('ends the session and goes to the login without returnTo when signing out from the navbar menu', async () => {
    renderLayout();

    await userEvent.click(await screen.findByRole('button', { name: 'Perfil de Mariana Costa' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }));

    expect(await screen.findByText('/login|sem returnTo')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
