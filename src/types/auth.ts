export type UserRole = 'ADMIN' | 'COMPANY' | 'STUDENT' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  status?: string;
}
