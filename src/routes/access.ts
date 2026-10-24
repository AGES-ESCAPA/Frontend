import type { SidebarRole } from '@components/layout';
import type { UserRole } from '@/types/auth';

export const getDefaultRoute = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/cursos';
    case 'COMPANY':
      return '/empresa/colaboradores';
    case 'STUDENT':
    case 'EMPLOYEE':
      return '/meus-cursos';
  }
};

export const toSidebarRole = (role: UserRole): SidebarRole => {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'COMPANY':
      return 'company';
    case 'STUDENT':
    case 'EMPLOYEE':
      return 'student';
  }
};

const isInternalPath = (path: string | null | undefined): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export const getPostLoginDestination = (role: UserRole, returnTo?: string): string => {
  const purchaseRedirect = localStorage.getItem('escapa:purchase-redirect');
  if (purchaseRedirect) localStorage.removeItem('escapa:purchase-redirect');

  if (isInternalPath(returnTo)) return returnTo;
  if (isInternalPath(purchaseRedirect)) return purchaseRedirect;

  return getDefaultRoute(role);
};
