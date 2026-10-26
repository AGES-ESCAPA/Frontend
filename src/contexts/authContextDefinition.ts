import { createContext } from 'react';
import type { AuthUser } from '@/types/auth';

/** Dados da sessão que mudam sem novo login (ex.: nome e foto salvos no perfil). */
export type AuthUserChanges = Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>;

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (token: string, user: AuthUser, expiresIn?: number) => void;
  logout: () => void;
  updateUser: (changes: AuthUserChanges) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
