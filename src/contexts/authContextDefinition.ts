import { createContext } from 'react';
import type { AuthUser } from '@/types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (token: string, user: AuthUser, expiresIn?: number) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
