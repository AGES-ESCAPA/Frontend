import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setMockUserRole } from '@services/mockAuthService';
import { ProtectedRoute } from './ProtectedRoute';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin/pedidos']}>
      <Routes>
        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute role="admin">
              <h1>Gestão de Pedidos</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<h1>Login</h1>} />
      </Routes>
    </MemoryRouter>,
  );

// Cobrem o redirecionamento sem perfil/não admin e o acesso permitido ao admin demo.
describe('ProtectedRoute', () => {
  it('redirects to login when no profile is selected', () => {
    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Gestão de Pedidos' })).not.toBeInTheDocument();
  });

  it('redirects non-admin profiles away from the orders page', () => {
    setMockUserRole('student');

    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Gestão de Pedidos' })).not.toBeInTheDocument();
  });

  it('allows the admin profile to access the orders page', () => {
    setMockUserRole('admin');

    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: 'Gestão de Pedidos' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
  });
});
