import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanyEmployeePage, CompanySeats } from '@/types/companyEmployee';

import { CompanyEmployeeServiceError, companyEmployeeService } from './companyEmployeeService';

// Simula apenas o fetch nativo.
// authenticatedFetch continua sendo executado normalmente.
const fetchMock = vi.spyOn(globalThis, 'fetch');

const response = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const seats: CompanySeats = {
  seatsTotal: 10,
  seatsUsed: 9,
  seatsAvailable: 1,
  employeesTotal: 9,
  employeesActive: 6,
};

const page: CompanyEmployeePage = {
  content: [
    {
      id: 'employee-1',
      name: 'Ana Paula Ferreira',
      email: 'ana@empresa.com.br',
      jobTitle: 'Recepção',
      status: 'ACTIVE',
      assignedCourses: 3,
      avatarUrl: null,
    },
  ],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
};

describe('companyEmployeeService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('obtém os indicadores pelo cliente HTTP autenticado', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: seats,
      }),
    );

    const signal = new AbortController().signal;

    await expect(companyEmployeeService.getSeats(signal)).resolves.toEqual(seats);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/seats',
      expect.objectContaining({
        signal,
        headers: expect.any(Headers),
      }),
    );
  });

  it('envia busca, página e tamanho ao servidor', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: page,
      }),
    );

    await expect(companyEmployeeService.listEmployees(' Ana ', 2, 15)).resolves.toEqual(page);

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));

    expect(parsed.pathname).toBe('/api/v1/company/employees');

    expect(parsed.searchParams.get('search')).toBe('Ana');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('size')).toBe('15');
  });

  it('cadastra um colaborador usando a rota autenticada', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: { employee: page.content[0], inviteSent: true },
      }),
    );

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
        jobTitle: 'Recepção',
      }),
    ).resolves.toEqual({ employee: page.content[0], inviteSent: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/employees',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Ana Paula Ferreira',
          email: 'ana@empresa.com.br',
          jobTitle: 'Recepção',
        }),
        headers: expect.any(Headers),
      }),
    );
  });

  it('mapeia conflito de e-mail duplicado para mensagem de campo', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: 'Este e-mail já está cadastrado.',
        },
        409,
      ),
    );

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
        jobTitle: 'Recepção',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Este e-mail já está cadastrado.',
    });
  });

  it('mapeia a mensagem de e-mail duplicado retornada pelo backend', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Email already registered' }, 409));

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
        jobTitle: 'Recepção',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Este e-mail já está cadastrado.',
    });
  });

  it('mapeia conflito de vagas esgotadas para a mensagem esperada', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: 'Não há vagas disponíveis.',
        },
        409,
      ),
    );

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
        jobTitle: 'Recepção',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.',
    });
  });

  it('atualiza status e dados na rota do colaborador', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: page.content[0],
      }),
    );

    await companyEmployeeService.updateEmployee('employee/1', {
      name: 'Ana Paula Ferreira',
      email: 'ana@empresa.com.br',
      jobTitle: 'Recepção',
      status: 'INACTIVE',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/employees/employee%2F1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"status":"INACTIVE"'),
      }),
    );
  });

  it('reenviar convite usa o endpoint do colaborador', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: page.content[0],
      }),
    );

    await companyEmployeeService.resendInvite('employee-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/employees/employee-1/invitation',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('conclui o convite pela rota pública', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: {
          accessToken: 'jwt',
          expiresIn: 3600,
          user: { id: 'employee-1', name: 'Ana', email: 'ana@empresa.com.br', profile: 'EMPLOYEE' },
        },
        message: 'Invitation completed',
      }),
    );

    await expect(
      companyEmployeeService.completeInvitation({
        token: 'invitation-token',
        password: 'secure-password',
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/invites/invitation-token/password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ password: 'secure-password' }),
      }),
    );
  });

  it('carrega os dados do convite usando a rota pública do backend', async () => {
    const invitation = {
      name: 'Ana Lima',
      email: 'ana@empresa.com.br',
      companyName: 'Empresa Escapa',
    };
    fetchMock.mockResolvedValueOnce(response({ success: true, data: invitation }));

    await expect(companyEmployeeService.getInvitation('token/seguro')).resolves.toEqual(invitation);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/invites/token%2Fseguro',
      expect.any(Object),
    );
  });

  it('omite o filtro vazio e utiliza a primeira página por padrão', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: page,
      }),
    );

    await companyEmployeeService.listEmployees(' ');

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));

    expect(parsed.searchParams.has('search')).toBe(false);
    expect(parsed.searchParams.get('page')).toBe('0');
    expect(parsed.searchParams.get('size')).toBe('10');
  });

  it('envia o token Bearer da sessão autenticada', async () => {
    localStorage.setItem('access_token', 'token-de-teste');

    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: seats,
      }),
    );

    await companyEmployeeService.getSeats();

    const [, options] = fetchMock.mock.calls[0];

    const headers = new Headers(options?.headers);

    expect(headers.get('Authorization')).toBe('Bearer token-de-teste');
  });

  it('retorna mensagens padronizadas em português para erros HTTP', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: 'Access denied',
        },
        403,
      ),
    );

    await expect(companyEmployeeService.getSeats()).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 403,
      message: 'Você não tem permissão para acessar os dados desta empresa.',
    });
  });

  it('preserva a mensagem da API para erros 400', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: 'Informe um cargo válido.',
        },
        400,
      ),
    );

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
        jobTitle: '',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Informe um cargo válido.',
    });
  });

  it('não exibe mensagens em inglês retornadas pelo backend', async () => {
    fetchMock.mockResolvedValueOnce(
      response(
        {
          message: 'Company not found',
        },
        404,
      ),
    );

    await expect(companyEmployeeService.getSeats()).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 404,
      message: 'Não foi possível encontrar os dados da empresa.',
    });
  });

  it('diferencia erro de rede de erro HTTP', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(companyEmployeeService.listEmployees()).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 0,
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    });
  });

  it('não transforma abortos em erros de conexão', async () => {
    const controller = new AbortController();

    controller.abort();

    const abortError = new DOMException('Aborted', 'AbortError');

    fetchMock.mockRejectedValueOnce(abortError);

    await expect(companyEmployeeService.getSeats(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Aborted',
    });
  });

  it('recusa um envelope de resposta inválido', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        data: null,
      }),
    );

    await expect(companyEmployeeService.getSeats()).rejects.toThrow('Resposta inválida');
  });

  it('retorna um erro tipado quando ocorre falha de rede', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network error'));

    await expect(companyEmployeeService.getSeats()).rejects.toBeInstanceOf(
      CompanyEmployeeServiceError,
    );
  });
});
