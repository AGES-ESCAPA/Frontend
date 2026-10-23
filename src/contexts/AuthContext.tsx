import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setUnauthorizedHandler } from '@services/api';
import { AuthServiceError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthContext } from './authContextDefinition';
import type { AuthContextValue } from './authContextDefinition';

const ACCESS_TOKEN_KEY = 'access_token';
const EXPIRES_AT_KEY = 'access_token_expires_at';

const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const value = localStorage.getItem(EXPIRES_AT_KEY);
    return value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    setExpiresAt(null);
    setUser(null);
  }, []);

  const login = useCallback((token: string, nextUser: AuthUser, expiresIn?: number) => {
    const expiration = expiresIn === undefined ? null : Date.now() + expiresIn * 1000;
    if (expiration === null) localStorage.removeItem(EXPIRES_AT_KEY);
    else localStorage.setItem(EXPIRES_AT_KEY, String(expiration));
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setExpiresAt(expiration);
    setUser(nextUser);
    setIsRestoring(false);
  }, []);

  useEffect(() => {
    if (expiresAt === null) return;
    let timer: number;
    const scheduleExpiration = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) logout();
      else timer = window.setTimeout(scheduleExpiration, Math.min(remaining, 2_147_483_647));
    };
    scheduleExpiration();
    return () => window.clearTimeout(timer);
  }, [expiresAt, logout]);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsRestoring(false);
      return;
    }
    const savedExpiration = localStorage.getItem(EXPIRES_AT_KEY);
    if (savedExpiration !== null && Number(savedExpiration) <= Date.now()) {
      logout();
      setIsRestoring(false);
      return;
    }

    let active = true;
    const restoreSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser(token);
        if (active && getStoredToken() === token) setUser(currentUser);
      } catch (error: unknown) {
        if (active && error instanceof AuthServiceError && error.status === 401) logout();
      } finally {
        if (active) setIsRestoring(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isRestoring, login, logout }),
    [isRestoring, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
