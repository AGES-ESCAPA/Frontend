import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ProtectedRoute } from '@routes/ProtectedRoute';
import { authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthenticatedLayout } from './AuthenticatedLayout';

const student: AuthUser = {
  id: 'b1',
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  role: 'STUDENT',
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

  it('ends the session and goes to the login without returnTo when signing out from the sidebar', async () => {
    const onLogout = vi.fn();
    renderLayout(onLogout);

    await userEvent.click(await screen.findByRole('button', { name: 'Sair da conta' }));

    expect(await screen.findByText('/login|sem returnTo')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
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
