import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
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
    vi.useRealTimers();
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

  it('uses the registration lifetime in seconds and ends the session at expiration', () => {
    vi.useFakeTimers();
    const now = Date.now();
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    act(() => result.current.login('registration-token', student, 120));
    expect(localStorage.getItem('access_token')).toBe('registration-token');
    expect(localStorage.getItem('access_token_expires_at')).toBe(String(now + 120_000));
    expect(result.current.user).toEqual(student);
    expect(result.current.isAuthenticated).toBe(true);
    act(() => vi.advanceTimersByTime(120_000));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('access_token_expires_at')).toBeNull();
  });

  it('does not restore a session whose persisted lifetime has already elapsed', async () => {
    localStorage.setItem('access_token', 'expired-registration-token');
    localStorage.setItem('access_token_expires_at', String(Date.now() - 1000));
    const getCurrentUser = vi.spyOn(authService, 'getCurrentUser');
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText('false|false|anonymous');
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
