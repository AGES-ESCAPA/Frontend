export type UserRole = 'ADMIN' | 'COMPANY' | 'STUDENT' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  status?: string;
}

export interface CompanyRegistrationValues {
  responsibleName: string;
  cnpj: string;
  companyName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}

export type CompanyRegistrationField = keyof CompanyRegistrationValues;
export type CompanyRegistrationErrors = Partial<Record<CompanyRegistrationField, string>>;
export interface CompanyRegistrationPayload {
  responsibleName: string;
  cnpj: string;
  companyName: string;
  email: string;
  phone: string;
  password: string;
}

/** Campo que o backend acusa como já cadastrado ao responder 409. */
export type DuplicateRegistrationField = 'cnpj' | 'email';
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
