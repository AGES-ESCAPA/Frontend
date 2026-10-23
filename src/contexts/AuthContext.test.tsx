import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
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

describe('AuthProvider', () => {
  afterEach(() => {
    localStorage.clear();
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
