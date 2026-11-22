export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  status?: string | null;
  createdAt: string;
}

/** Detalhe administrativo (`GET /api/v1/users/{id}`) com campos de cadastro do perfil. */
export interface AdminUserDetail extends AdminUser {
  cpf?: string | null;
  phone?: string | null;
  companyName?: string | null;
  cnpj?: string | null;
  /** Novo e-mail aguardando confirmação do link; omitido quando não há troca pendente. */
  pendingEmail?: string | null;
}

/** Corpo de `PUT /api/v1/users/{id}` (CPF/CNPJ e e-mail ativo são imutáveis neste endpoint). */
export interface AdminUserUpdatePayload {
  name: string;
  phone?: string;
  companyName?: string;
}
