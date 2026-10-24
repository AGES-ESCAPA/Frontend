import { authService } from './authService';

const payload = {
  name: ' Maria da Silva ',
  cpf: '529.982.247-25',
  email: ' MARIA@EXEMPLO.COM ',
  phone: '(51) 99999-0000',
  password: ' senha segura ',
};
const backendUser = {
  id: 'student-21',
  name: 'Maria da Silva',
  email: 'maria@exemplo.com',
  profile: 'STUDENT',
};
const data = {
  accessToken: 'jwt-registration',
  tokenType: 'Bearer',
  expiresIn: 120,
  user: backendUser,
};

describe('authService.registerStudent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it('posts only the contract fields with numeric CPF/phone and preserves the exact password', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await expect(authService.registerStudent(payload, controller.signal)).resolves.toEqual({
      token: 'jwt-registration',
      expiresIn: 120,
      user: {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: 'STUDENT',
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe('/api/v1/auth/register/student');
    expect(init).toEqual({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: 'Maria da Silva',
        cpf: '52998224725',
        email: 'maria@exemplo.com',
        phone: '51999990000',
        password: payload.password,
      }),
      signal: controller.signal,
    });
  });
  it('omits an optional blank phone', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    await authService.registerStudent({ ...payload, phone: '   ' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Maria da Silva',
      cpf: '52998224725',
      email: 'maria@exemplo.com',
      password: payload.password,
    });
  });
  it.each([
    {
      message: 'email already registered',
      fieldErrors: { email: 'Este e-mail já está cadastrado. Entre na sua conta.' },
    },
    { message: 'cpf already registered', fieldErrors: { cpf: 'Este CPF já está cadastrado.' } },
    { message: 'Another conflict', fieldErrors: {} },
  ])('maps 409: $message', async ({ message, fieldErrors }) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ status: 409, message }), { status: 409 })),
    );
    await expect(authService.registerStudent(payload)).rejects.toMatchObject({
      name: 'AuthServiceError',
      status: 409,
      fieldErrors,
    });
  });
  it('translates concatenated 400 messages into field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: 'Invalid CPF, Invalid phone' }), { status: 400 }),
        ),
    );
    await expect(authService.registerStudent(payload)).rejects.toMatchObject({
      status: 400,
      fieldErrors: {
        cpf: 'Informe um CPF válido.',
        phone: 'Informe um telefone com DDD e 10 ou 11 dígitos.',
      },
    });
  });
  it('keeps unrecognized 400 API messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Dados de cadastro incompatíveis.' }), {
          status: 400,
        }),
      ),
    );
    await expect(authService.registerStudent(payload)).rejects.toMatchObject({
      status: 400,
      message: 'Dados de cadastro incompatíveis.',
    });
  });
  it('does not retry a network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(authService.registerStudent(payload)).rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('uses a Portuguese fallback for server errors even with a non-JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 500 })));
    await expect(authService.registerStudent(payload)).rejects.toMatchObject({
      status: 500,
      message: 'O serviço está indisponível no momento. Tente novamente mais tarde.',
    });
  });
  it.each([
    { success: false, data },
    { success: true, data: { ...data, accessToken: '' } },
    { success: true, data: { ...data, expiresIn: 0 } },
    { success: true, data: { ...data, tokenType: 'Basic' } },
    { success: true, data: { ...data, user: { ...backendUser, profile: 'ADMIN' } } },
  ])('rejects an unexpected success response %#', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 201 })),
    );
    await expect(authService.registerStudent(payload)).rejects.toMatchObject({
      message:
        'Não foi possível confirmar sua sessão. Tente entrar na sua conta antes de cadastrar novamente.',
    });
  });
});
