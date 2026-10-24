import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthServiceError, authService } from './authService';

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
});
