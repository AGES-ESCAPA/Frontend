import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { ProfileType, ProfileUpdate, UserProfile } from '@/types/profile';

const ME_URL = `${getApiBaseUrl()}/me`;

const PROFILE_TYPES: readonly ProfileType[] = ['STUDENT', 'EMPLOYEE', 'COMPANY', 'ADMIN'];

/** Erro com o status HTTP, para a tela separar erro de campo (400) de falha de rede. */
export class ProfileServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProfileServiceError';
    this.status = status;
  }
}

/** A API omite os campos que não se aplicam ao perfil. */
interface ProfileResponse {
  profile: string;
  editable: boolean;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  companyName?: string | null;
  cnpj?: string | null;
  avatarUrl?: string | null;
}

const isProfileType = (value: string): value is ProfileType =>
  (PROFILE_TYPES as readonly string[]).includes(value);

const mapProfile = (data: ProfileResponse): UserProfile => {
  if (!isProfileType(data.profile)) {
    throw new ProfileServiceError(500, 'A resposta do perfil contém um tipo de perfil inválido.');
  }

  return {
    profile: data.profile,
    editable: data.editable,
    name: data.name,
    email: data.email,
    cpf: data.cpf ?? null,
    phone: data.phone ?? null,
    companyName: data.companyName ?? null,
    cnpj: data.cnpj ?? null,
    avatarUrl: data.avatarUrl ?? null,
  };
};

const readData = async <T>(response: Response, fallback: string): Promise<T> => {
  if (!response.ok) {
    throw new ProfileServiceError(
      response.status,
      (await readApiErrorMessage(response)) ?? fallback,
    );
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
};

export const profileService = {
  async getProfile(signal?: AbortSignal): Promise<UserProfile> {
    const response = await authenticatedFetch(`${ME_URL}/profile`, { signal });
    return mapProfile(
      await readData<ProfileResponse>(response, 'Não foi possível carregar seus dados.'),
    );
  },

  async updateProfile(payload: ProfileUpdate): Promise<UserProfile> {
    const response = await authenticatedFetch(`${ME_URL}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapProfile(
      await readData<ProfileResponse>(response, 'Não foi possível salvar seus dados.'),
    );
  },

  /** Envia a foto em `multipart/form-data` e devolve a URL pública da nova imagem. */
  async uploadAvatar(file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file);

    const response = await authenticatedFetch(`${ME_URL}/avatar`, { method: 'PUT', body });
    const data = await readData<{ avatarUrl: string }>(response, 'Não foi possível enviar a foto.');
    return data.avatarUrl;
  },

  async deactivateAccount(currentPassword: string): Promise<void> {
    const response = await authenticatedFetch(`${ME_URL}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });

    if (!response.ok) {
      throw new ProfileServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível desativar a conta.',
      );
    }
  },

  /** A senha atual incorreta volta como 400 (não 401), então a sessão continua ativa. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await authenticatedFetch(`${ME_URL}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      throw new ProfileServiceError(
        response.status,
        (await readApiErrorMessage(response)) ?? 'Não foi possível alterar a senha.',
      );
    }
  },
};
