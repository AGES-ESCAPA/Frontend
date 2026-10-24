export type UserRole = 'ADMIN' | 'COMPANY' | 'STUDENT' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  status?: string;
}

export interface StudentRegistrationPayload {
  name: string;
  cpf: string;
  email: string;
  phone?: string;
  password: string;
}

export interface StudentRegistrationValues extends StudentRegistrationPayload {
  phone: string;
  confirmPassword: string;
}

export interface StudentRegistrationSession {
  token: string;
  user: AuthUser;
  expiresIn: number;
}

export type RegistrationField = keyof StudentRegistrationValues;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;
