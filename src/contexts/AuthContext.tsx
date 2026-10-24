import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setUnauthorizedHandler } from '@services/api';
import { AuthServiceError, authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthContext } from './authContextDefinition';
import type { AuthContextValue } from './authContextDefinition';

const ACCESS_TOKEN_KEY = 'access_token';

const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setUser(null);
  }, []);

  const login = useCallback((token: string, nextUser: AuthUser) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setUser(nextUser);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
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
