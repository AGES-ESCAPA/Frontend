import { getApiBaseUrl } from '@services/runtimeEnv';
import { readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import type {
  AuthUser,
  UserRole,
  RegistrationErrors,
  StudentRegistrationPayload,
  StudentRegistrationSession,
} from '@/types/auth';
import { onlyDigits } from '@utils/masks';
import { mapRegistrationErrors } from '@utils/studentRegistration';

const API_BASE_URL = getApiBaseUrl();

interface LoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  profile: string;
  avatarUrl?: string | null;
  status?: string;
}

export class AuthServiceError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
    public fieldErrors: RegistrationErrors = {},
  ) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

const getResponseData = async <T>(response: Response, fallback: string): Promise<T> => {
  if (!response.ok) {
    throw new AuthServiceError(response.status, (await readApiErrorMessage(response)) ?? fallback);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
};

const isUserRole = (role: string): role is UserRole =>
  role === 'ADMIN' || role === 'COMPANY' || role === 'STUDENT' || role === 'EMPLOYEE';

const mapAuthUser = (user: AuthUserResponse): AuthUser => {
  const role = user.profile;

  if (!role || !isUserRole(role)) {
    throw new AuthServiceError(500, 'A resposta de autenticação contém um perfil inválido.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    ...(user.avatarUrl !== undefined ? { avatarUrl: user.avatarUrl } : {}),
    ...(user.status !== undefined ? { status: user.status } : {}),
  };
};

export const authService = {
  async registerStudent(
    payload: StudentRegistrationPayload,
    signal?: AbortSignal,
  ): Promise<StudentRegistrationSession> {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: payload.name.trim(),
        cpf: onlyDigits(payload.cpf),
        email: payload.email.trim().toLowerCase(),
        ...(payload.phone?.trim() ? { phone: onlyDigits(payload.phone) } : {}),
        password: payload.password,
      }),
      signal,
    });
    if (!response.ok) {
      const message = await readApiErrorMessage(response);
      const fieldErrors = mapRegistrationErrors(response.status, message);
      throw new AuthServiceError(
        response.status,
        Object.keys(fieldErrors).length > 0
          ? Object.values(fieldErrors).join(' ')
          : response.status === 409
            ? 'Não foi possível cadastrar: os dados informados já estão em uso.'
            : response.status >= 500
              ? 'O serviço está indisponível no momento. Tente novamente mais tarde.'
              : response.status === 400 && message
                ? message
                : 'Não foi possível concluir o cadastro. Confira seus dados e tente novamente.',
        fieldErrors,
      );
    }
    const body: unknown = await response.json().catch(() => null);
    const data =
      body !== null &&
      typeof body === 'object' &&
      'success' in body &&
      body.success === true &&
      'data' in body
        ? body.data
        : null;
    if (
      response.status === 201 &&
      data !== null &&
      typeof data === 'object' &&
      'accessToken' in data &&
      typeof data.accessToken === 'string' &&
      data.accessToken.length > 0 &&
      'tokenType' in data &&
      data.tokenType === 'Bearer' &&
      'expiresIn' in data &&
      typeof data.expiresIn === 'number' &&
      Number.isFinite(data.expiresIn) &&
      data.expiresIn > 0 &&
      'user' in data &&
      data.user !== null &&
      typeof data.user === 'object' &&
      'id' in data.user &&
      typeof data.user.id === 'string' &&
      data.user.id.length > 0 &&
      'name' in data.user &&
      typeof data.user.name === 'string' &&
      'email' in data.user &&
      typeof data.user.email === 'string' &&
      'profile' in data.user &&
      data.user.profile === 'STUDENT'
    )
      return {
        token: data.accessToken,
        expiresIn: data.expiresIn,
        user: mapAuthUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          profile: data.user.profile,
        }),
      };
    throw new AuthServiceError(
      response.status,
      'Não foi possível confirmar sua sessão. Tente entrar na sua conta antes de cadastrar novamente.',
    );
  },

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await getResponseData<LoginResponse>(
      response,
      'Não foi possível entrar na conta.',
    );
    const token = data.accessToken;

    if (!token) {
      throw new AuthServiceError(500, 'A resposta de autenticação não contém um token.');
    }

    return { token, user: mapAuthUser(data.user) };
  },

  async getCurrentUser(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await getResponseData<AuthUserResponse>(
      response,
      'Não foi possível restaurar a sessão.',
    );

    return mapAuthUser(user);
  },
};
