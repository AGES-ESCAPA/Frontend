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
