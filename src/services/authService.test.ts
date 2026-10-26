import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthServiceError, authService } from './authService';
import { DuplicateRegistrationError } from './authService';

const backendUser = {
  id: 'user-1',
  name: 'Jorge Amado',
  email: 'jorge@example.com',
  profile: 'STUDENT',
};

const user = {
  id: backendUser.id,
  name: backendUser.name,
  email: backendUser.email,
  role: 'STUDENT' as const,
};

describe('authService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends credentials and returns the normalized login session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { accessToken: 'jwt-token', expiresIn: 120, user: backendUser },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(authService.login(user.email, 'senha-segura')).resolves.toEqual({
      token: 'jwt-token',
      expiresIn: 120,
      user,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/login');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ email: user.email, password: 'senha-segura' }));
  });

  it.each([undefined, null, 0, -1, '120', NaN, Infinity])(
    'rejects an invalid login lifetime: %s',
    async (expiresIn) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { accessToken: 'jwt-token', user: backendUser, expiresIn },
          }),
        }),
      );
      await expect(authService.login(user.email, 'senha-segura')).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 500,
        message: 'A resposta de autenticação contém um prazo de sessão inválido.',
      });
    },
  );

  it('surfaces the backend status and message for invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Credenciais inválidas.' }),
      }),
    );

    await expect(authService.login(user.email, 'senha-errada')).rejects.toMatchObject({
      name: AuthServiceError.name,
      status: 401,
      message: 'Credenciais inválidas.',
    });
  });

  it('sends the bearer token when restoring the current user', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: backendUser }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(authService.getCurrentUser('jwt-token')).resolves.toEqual(user);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer jwt-token');
  });

  it('rejects a response with an unknown backend profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              accessToken: 'jwt-token',
              expiresIn: 120,
              user: { ...backendUser, profile: 'UNKNOWN' },
            },
          }),
      }),
    );

    await expect(authService.login(user.email, 'senha-segura')).rejects.toMatchObject({
      name: AuthServiceError.name,
      status: 500,
    });
  });

  describe('registerCompany', () => {
    const payload = {
      responsibleName: 'Maria Oliveira',
      cnpj: '11222333000181',
      companyName: 'Empresa Ltda.',
      email: 'contato@empresa.com.br',
      phone: '1130000000',
      password: 'senha-segura',
    };

    const companyUser = {
      id: 'company-1',
      name: 'Maria Oliveira',
      email: 'contato@empresa.com.br',
      profile: 'COMPANY',
    };

    const conflictResponse = (message: string) => ({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ status: 409, error: 'Conflict', message }),
    });

    it('POSTs the company data and returns the manager session', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({ success: true, data: { accessToken: 'jwt-token', user: companyUser } }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.registerCompany(payload)).resolves.toEqual({
        token: 'jwt-token',
        user: {
          id: 'company-1',
          name: 'Maria Oliveira',
          email: 'contato@empresa.com.br',
          role: 'COMPANY',
        },
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/register/company');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('identifies a CNPJ that is already registered', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(conflictResponse('cnpj already registered')),
      );

      await expect(authService.registerCompany(payload)).rejects.toMatchObject({
        name: DuplicateRegistrationError.name,
        status: 409,
        field: 'cnpj',
      });
    });

    it('identifies an e-mail that is already registered', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(conflictResponse('email already registered')),
      );

      await expect(authService.registerCompany(payload)).rejects.toMatchObject({
        name: DuplicateRegistrationError.name,
        field: 'email',
      });
    });

    it('leaves the field empty when the conflict does not say which one', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(conflictResponse('Resource already exists')),
      );

      await expect(authService.registerCompany(payload)).rejects.toMatchObject({
        name: DuplicateRegistrationError.name,
        field: null,
      });
    });

    it('surfaces other failures with their status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'cnpj is invalid' }),
        }),
      );

      await expect(authService.registerCompany(payload)).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 400,
        message: 'cnpj is invalid',
      });
    });
  });
});
