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

  describe('invites', () => {
    const inviteToken = 'convite-felipe-andrade-dev';

    const invite = {
      name: 'Felipe Andrade',
      email: 'felipe.andrade@vistamar.com.br',
      companyName: 'Pousada Vista Mar LTDA',
    };

    const employeeUser = {
      id: 'employee-1',
      name: 'Felipe Andrade',
      email: 'felipe.andrade@vistamar.com.br',
      profile: 'EMPLOYEE',
    };

    const errorResponse = (status: number, message: string) => ({
      ok: false,
      status,
      json: () => Promise.resolve({ status, error: 'Error', message }),
    });

    it('GETs the invite of the token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: invite }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.getInvite(inviteToken)).resolves.toEqual(invite);

      expect(fetchMock.mock.calls[0][0]).toContain(`/auth/invites/${inviteToken}`);
    });

    it('encodes the token in the invite URL', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: invite }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await authService.getInvite('a/b?c');

      expect(fetchMock.mock.calls[0][0]).toContain('/auth/invites/a%2Fb%3Fc');
    });

    it('rejects an invalid or used invite with status 404', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(404, 'Invite not found')));

      await expect(authService.getInvite(inviteToken)).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 404,
      });
    });

    it('rejects an expired invite with status 410', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(410, 'Invite has expired')));

      await expect(authService.getInvite(inviteToken)).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 410,
      });
    });

    it('POSTs the password and returns the employee session', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              accessToken: 'jwt-token',
              tokenType: 'Bearer',
              expiresIn: 3600,
              user: employeeUser,
            },
          }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.createInvitePassword(inviteToken, 'senha-segura')).resolves.toEqual({
        token: 'jwt-token',
        expiresIn: 3600,
        user: {
          id: 'employee-1',
          name: 'Felipe Andrade',
          email: 'felipe.andrade@vistamar.com.br',
          role: 'EMPLOYEE',
        },
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`/auth/invites/${inviteToken}/password`);
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ password: 'senha-segura' }));
    });

    it('rejects a password the backend considers invalid with status 400', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(400, 'Password must be at least 8 characters')),
      );

      await expect(authService.createInvitePassword(inviteToken, '1234567')).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 400,
      });
    });

    it('rejects the password of an invite already used with status 404', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(404, 'Invite not found')));

      await expect(
        authService.createInvitePassword(inviteToken, 'senha-segura'),
      ).rejects.toMatchObject({ name: AuthServiceError.name, status: 404 });
    });

    it('rejects the password of an expired invite with status 410', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(410, 'Invite has expired')));

      await expect(
        authService.createInvitePassword(inviteToken, 'senha-segura'),
      ).rejects.toMatchObject({ name: AuthServiceError.name, status: 410 });
    });

    it('propagates a network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      await expect(authService.createInvitePassword(inviteToken, 'senha-segura')).rejects.toThrow(
        'Failed to fetch',
      );
    });
  });

  describe('registerStudent', () => {
    const payload = {
      name: '  Carla Souza  ',
      cpf: '390.111.222-33',
      email: '  Carla@Example.COM  ',
      phone: '(51) 99120-3344',
      password: 'senha-segura',
    };

    const successBody = {
      success: true,
      data: {
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: backendUser,
      },
    };

    it('POSTs normalized data and returns the student session', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(successBody),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.registerStudent(payload)).resolves.toEqual({
        token: 'jwt-token',
        expiresIn: 3600,
        user,
      });

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/register/student');
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual({
        name: 'Carla Souza',
        cpf: '39011122233',
        email: 'carla@example.com',
        phone: '51991203344',
        password: 'senha-segura',
      });
    });

    it('surfaces fieldErrors from a 400 validation response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid CPF, Invalid email' }),
        }),
      );

      const error = await authService.registerStudent(payload).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(AuthServiceError);
      expect((error as AuthServiceError).status).toBe(400);
      expect((error as AuthServiceError).fieldErrors).toMatchObject({
        cpf: expect.any(String),
        email: expect.any(String),
      });
    });

    it('maps a 409 e-mail conflict to fieldErrors', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ message: 'email already registered' }),
        }),
      );

      await expect(authService.registerStudent(payload)).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 409,
        fieldErrors: { email: expect.any(String) },
      });
    });

    it('uses the generic 5xx message when the service is unavailable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ message: 'Service unavailable' }),
        }),
      );

      await expect(authService.registerStudent(payload)).rejects.toMatchObject({
        status: 503,
        message: 'O serviço está indisponível no momento. Tente novamente mais tarde.',
      });
    });

    it('rejects when the success payload does not include a valid session', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ success: true, data: { accessToken: '' } }),
        }),
      );

      await expect(authService.registerStudent(payload)).rejects.toMatchObject({
        name: AuthServiceError.name,
        message: expect.stringContaining('Não foi possível confirmar sua sessão'),
      });
    });
  });

  describe('password reset', () => {
    const resetToken = 'token/reset?x=1';
    const email = '  User@Mail.COM  ';

    const errorResponse = (status: number, message: string) => ({
      ok: false,
      status,
      json: () => Promise.resolve({ status, error: 'Error', message }),
    });

    it('POSTs the normalized e-mail on requestPasswordReset', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.requestPasswordReset(email)).resolves.toBeUndefined();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/password-reset/request');
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual({ email: 'user@mail.com' });
    });

    it('throws AuthServiceError when requestPasswordReset fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(404, 'User not found')));

      await expect(authService.requestPasswordReset(email)).rejects.toMatchObject({
        name: AuthServiceError.name,
        status: 404,
        message: 'User not found',
      });
    });

    it('GETs the reset token and returns the e-mail', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { email: 'user@mail.com' } }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.getPasswordResetToken(resetToken)).resolves.toEqual({
        email: 'user@mail.com',
      });

      expect(fetchMock.mock.calls[0][0]).toContain('/auth/password-reset/token%2Freset%3Fx%3D1');
    });

    it('rejects an invalid reset link', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(410, 'Reset link expired')));

      await expect(authService.getPasswordResetToken(resetToken)).rejects.toMatchObject({
        status: 410,
        message: 'Reset link expired',
      });
    });

    it('POSTs the new password on resetPassword', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.resetPassword(resetToken, 'nova-senha')).resolves.toBeUndefined();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/password-reset/token%2Freset%3Fx%3D1');
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual({ password: 'nova-senha' });
    });

    it('throws AuthServiceError when resetPassword is rejected', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(400, 'Password must be at least 8 characters')),
      );

      await expect(authService.resetPassword(resetToken, '123')).rejects.toMatchObject({
        status: 400,
        message: 'Password must be at least 8 characters',
      });
    });
  });

  describe('email change', () => {
    const changeToken = 'change/confirm';

    const errorResponse = (status: number, message: string) => ({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    });

    it('GETs the change token and returns the preview', async () => {
      const preview = {
        name: 'Carla Souza',
        currentEmail: 'carla@old.com',
        newEmail: 'carla@new.com',
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: preview }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.getEmailChangeToken(changeToken)).resolves.toEqual(preview);

      expect(fetchMock.mock.calls[0][0]).toContain('/auth/email-change/change%2Fconfirm');
    });

    it('rejects an invalid email-change link', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(404, 'Change token not found')),
      );

      await expect(authService.getEmailChangeToken(changeToken)).rejects.toMatchObject({
        status: 404,
        message: 'Change token not found',
      });
    });

    it('POSTs confirm on confirmEmailChange', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
      vi.stubGlobal('fetch', fetchMock);

      await expect(authService.confirmEmailChange(changeToken)).resolves.toBeUndefined();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/email-change/change%2Fconfirm/confirm');
      expect(init.method).toBe('POST');
    });

    it('throws AuthServiceError when confirmEmailChange fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(410, 'Confirmation link expired')),
      );

      await expect(authService.confirmEmailChange(changeToken)).rejects.toMatchObject({
        status: 410,
        message: 'Confirmation link expired',
      });
    });
  });
});
