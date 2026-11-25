import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { getDefaultRoute } from './access';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactElement;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { isAuthenticated, isRestoring, user } = useAuth();
  const location = useLocation();

  if (isRestoring) return <PageSkeleton label="Restaurando sessão" />;

  if (!isAuthenticated || !user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
};
