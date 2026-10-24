import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getMockUserRole, type MockUserRole } from '@services/mockAuthService';

export interface ProtectedRouteProps {
  role: MockUserRole;
  children: ReactNode;
}

// Restringe a navegação pelo perfil demo; não substitui a autorização da API.
export const ProtectedRoute = ({ role, children }: ProtectedRouteProps) =>
  getMockUserRole() === role ? children : <Navigate to="/login" replace />;
