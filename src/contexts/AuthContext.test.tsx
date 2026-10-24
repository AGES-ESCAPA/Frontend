import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authenticatedFetch, setUnauthorizedHandler } from '@services/api';
import { AuthServiceError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthProvider } from '@contexts/AuthContext';
import { useAuth } from '@contexts/useAuth';

const student: AuthUser = {
  id: 'student-1',
  name: 'Jorge Amado',
  email: 'jorge@example.com',
  role: 'STUDENT',
};

const SessionProbe = () => {
  const { user, isAuthenticated, isRestoring } = useAuth();

  return <output>{`${isRestoring}|${isAuthenticated}|${user?.name ?? 'anonymous'}`}</output>;
};

const RenameProbe = () => {
  const { user, updateUser } = useAuth();

  return (
    <>
      <output>{`${user?.name ?? 'anonymous'}|${user?.email ?? ''}|${user?.avatarUrl ?? ''}`}</output>
      <button
        type="button"
        onClick={() => updateUser({ name: 'Jorge Amado Filho', avatarUrl: 'http://minio/a.png' })}
      >
        Atualizar
      </button>
    </>
  );
};

describe('AuthProvider', () => {
  afterEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('updates the name and photo of the session user keeping the other fields', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(student);

    render(
      <AuthProvider>
        <RenameProbe />
      </AuthProvider>,
    );

    await screen.findByText('Jorge Amado|jorge@example.com|');
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(
      screen.getByText('Jorge Amado Filho|jorge@example.com|http://minio/a.png'),
    ).toBeInTheDocument();
  });

  it('restores the session from a saved access token', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const getCurrentUser = vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(student);

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('false|true|Jorge Amado')).toBeInTheDocument());
    expect(getCurrentUser).toHaveBeenCalledWith('jwt-token');
  });

  it('clears an expired token when restoring the session fails with 401', async () => {
    localStorage.setItem('access_token', 'expired-token');
    vi.spyOn(authService, 'getCurrentUser').mockRejectedValue(new AuthServiceError(401, 'Expired'));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('false|false|anonymous')).toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('ends the session after a 401 from an authenticated request', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(student);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await screen.findByText('false|true|Jorge Amado');
    await act(async () => {
      await authenticatedFetch('/student/enrollments');
    });

    await waitFor(() => expect(screen.getByText('false|false|anonymous')).toBeInTheDocument());
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
