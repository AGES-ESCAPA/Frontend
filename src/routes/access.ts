import type { SidebarRole } from '@components/layout';
import type { UserRole } from '@/types/auth';
import { PURCHASE_REDIRECT_KEY, safeAuthReturnTo } from '@utils/authReturnTo';

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

export const getPostLoginDestination = (role: UserRole, returnTo?: string): string => {
  const purchaseRedirect = localStorage.getItem(PURCHASE_REDIRECT_KEY);
  if (purchaseRedirect) localStorage.removeItem(PURCHASE_REDIRECT_KEY);

  const destination = safeAuthReturnTo(returnTo) ?? safeAuthReturnTo(purchaseRedirect);
  if (destination) return destination;

  return getDefaultRoute(role);
};
