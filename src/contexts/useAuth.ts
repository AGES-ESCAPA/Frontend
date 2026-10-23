import { useContext } from 'react';
import { AuthContext } from './authContextDefinition';
import type { AuthContextValue } from './authContextDefinition';

export const useOptionalAuth = (): AuthContextValue | null => useContext(AuthContext);

export const useAuth = (): AuthContextValue => {
  const context = useOptionalAuth();
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');

  return context;
};
