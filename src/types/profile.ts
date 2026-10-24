export type ProfileType = 'STUDENT' | 'EMPLOYEE' | 'COMPANY' | 'ADMIN';

/** Dados cadastrais do usuário logado (`GET /api/v1/me/profile`), no formato do seu perfil. */
export interface UserProfile {
  profile: ProfileType;
  editable: boolean;
  /** Nome do aluno/funcionário ou do responsável pela empresa. */
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  /** Razão social da empresa ou, para o funcionário, a empresa vinculada. */
  companyName: string | null;
  cnpj: string | null;
  avatarUrl: string | null;
}

/** Campos editáveis enviados em `PUT /api/v1/me/profile`. */
export interface ProfileUpdate {
  name: string;
  /** Só dígitos; vazio apaga o telefone. */
  phone: string;
  /** Obrigatório para empresa, ignorado para aluno. */
  companyName?: string;
}
