import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyEmployee, CompanyEmployeePage, CompanySeats } from '@/types/companyEmployee';
import { CompanyEmployeeServiceError, companyEmployeeService } from './companyEmployeeService';

// Simula apenas o fetch nativo; authenticatedFetch continua sendo executado normalmente.
const fetchMock = vi.spyOn(globalThis, 'fetch');

const response = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const seats: CompanySeats = {
  seatsTotal: 10,
  seatsUsed: 9,
  seatsAvailable: 1,
  employeesTotal: 9,
  employeesActive: 6,
};

const employee: CompanyEmployee = {
  id: 'employee-1',
  name: 'Ana Paula Ferreira',
  email: 'ana@empresa.com.br',
  jobTitle: 'COLABORADOR',
  status: 'PENDING',
  assignedCourses: 3,
  avatarUrl: null,
};

const page: CompanyEmployeePage = {
  content: [employee],
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

  afterAll(() => fetchMock.mockRestore());

  it('obtém os indicadores pelo cliente HTTP autenticado', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: seats }));
    const signal = new AbortController().signal;

    await expect(companyEmployeeService.getSeats(signal)).resolves.toEqual(seats);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/seats',
      expect.objectContaining({ signal, headers: expect.any(Headers) }),
    );
  });

  it('envia busca, página e tamanho ao servidor', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: page }));
    await expect(companyEmployeeService.listEmployees(' Ana ', 2, 15)).resolves.toEqual(page);

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toBe('/api/v1/company/employees');
    expect(parsed.searchParams.get('search')).toBe('Ana');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('size')).toBe('15');
  });

  it('cadastra colaborador enviando apenas nome e e-mail e recebe a resposta plana da API', async () => {
    const created = {
      id: 'employee-1',
      name: 'Ana Paula Ferreira',
      email: 'ana@empresa.com.br',
      status: 'PENDING',
      assignedCourses: 3,
      avatarUrl: null,
      inviteSent: true,
    };
    fetchMock.mockResolvedValueOnce(response({ success: true, data: created }, 201));

    await expect(
      companyEmployeeService.createEmployee({
        name: 'Ana Paula Ferreira',
        email: 'ana@empresa.com.br',
      }),
    ).resolves.toEqual(created);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/employees',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ana Paula Ferreira', email: 'ana@empresa.com.br' }),
        headers: expect.any(Headers),
      }),
    );
  });

  it('mapeia conflito de e-mail duplicado retornado pelo backend', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'email already registered' }, 409));
    await expect(
      companyEmployeeService.createEmployee({ name: 'Ana', email: 'ana@empresa.com.br' }),
    ).rejects.toMatchObject({ status: 409, message: 'Este e-mail já está cadastrado.' });
  });

  it('mapeia a mensagem real de vagas esgotadas do backend', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: 'No free seat: all 10 seat(s) of the company are in use' }, 409),
    );
    await expect(
      companyEmployeeService.createEmployee({ name: 'Ana', email: 'ana@empresa.com.br' }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Não há vagas disponíveis. Compre mais assentos para cadastrar um colaborador.',
    });
  });

  it('mapeia conflito de reenvio para colaborador que não está pendente', async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: 'Employee employee-1 is not pending: ACTIVE' }, 409),
    );
    await expect(companyEmployeeService.resendInvite('employee-1')).rejects.toMatchObject({
      status: 409,
      message: 'Somente colaboradores pendentes podem receber um novo convite.',
    });
  });

  it('usa uma mensagem específica de reenvio para qualquer conflito 409', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Conflict' }, 409));

    await expect(companyEmployeeService.resendInvite('employee-1')).rejects.toMatchObject({
      status: 409,
      message: 'Somente colaboradores pendentes podem receber um novo convite.',
    });
  });

  it('reenviar convite usa endpoint correto e formato de resposta real', async () => {
    const result = { id: 'employee-1', email: 'ana@empresa.com.br', inviteSent: false };
    fetchMock.mockResolvedValueOnce(response({ success: true, data: result }));

    await expect(companyEmployeeService.resendInvite('employee-1')).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/company/employees/employee-1/invite',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('omite o filtro vazio e utiliza a primeira página por padrão', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: page }));
    await companyEmployeeService.listEmployees(' ');
    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.searchParams.has('search')).toBe(false);
    expect(parsed.searchParams.get('page')).toBe('0');
    expect(parsed.searchParams.get('size')).toBe('10');
  });

  it('envia o token Bearer da sessão autenticada', async () => {
    localStorage.setItem('access_token', 'token-de-teste');
    fetchMock.mockResolvedValueOnce(response({ success: true, data: seats }));
    await companyEmployeeService.getSeats();
    const [, options] = fetchMock.mock.calls[0];
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer token-de-teste');
  });

  it('retorna mensagem localizada para erros HTTP', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Access denied' }, 403));
    await expect(companyEmployeeService.getSeats()).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 403,
      message: 'Você não tem permissão para acessar os dados desta empresa.',
    });
  });

  it('preserva a mensagem da API para erros 400', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Informe um nome válido.' }, 400));
    await expect(
      companyEmployeeService.createEmployee({ name: '', email: 'ana@empresa.com.br' }),
    ).rejects.toMatchObject({ status: 400, message: 'Informe um nome válido.' });
  });

  it('não exibe mensagens em inglês para erros 404', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Company not found' }, 404));
    await expect(companyEmployeeService.getSeats()).rejects.toMatchObject({
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
    fetchMock.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    await expect(companyEmployeeService.getSeats(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Aborted',
    });
  });

  it('recusa envelope de resposta inválido', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: null }));
    await expect(companyEmployeeService.getSeats()).rejects.toThrow('Resposta inválida');
  });

  it('retorna erro tipado quando ocorre falha de rede', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network error'));
    await expect(companyEmployeeService.getSeats()).rejects.toBeInstanceOf(
      CompanyEmployeeServiceError,
    );
  });

  it('envia DELETE autenticado com o identificador do colaborador e retorna vagas', async () => {
    localStorage.setItem('access_token', 'token-desvinculacao');
    fetchMock.mockResolvedValueOnce(response({ success: true, data: seats }));

    await expect(companyEmployeeService.unlinkEmployee('employee-1')).resolves.toEqual(seats);

    const [url, options] = fetchMock.mock.calls[0];

    expect(String(url)).toBe('http://localhost:8080/api/v1/company/employees/employee-1');
    expect(options?.method).toBe('DELETE');
    expect(options?.body).toBeUndefined();
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer token-desvinculacao');
  });

  it('codifica o id no path sem mudar a rota', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: seats }));

    await companyEmployeeService.unlinkEmployee('id/com barra');

    expect(String(fetchMock.mock.calls[0][0])).toContain('/employees/id%2Fcom%20barra');
  });

  it('propaga HTTP 404 da desvinculação com o status tipado', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'Not found' }, 404));

    await expect(companyEmployeeService.unlinkEmployee('employee-1')).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 404,
    });
  });

  it('diferencia erro de rede durante desvinculação', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(companyEmployeeService.unlinkEmployee('employee-1')).rejects.toMatchObject({
      name: 'CompanyEmployeeServiceError',
      status: 0,
    });
  });

  it('recusa sucesso sem o resumo de vagas esperado', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, data: null }));

    await expect(companyEmployeeService.unlinkEmployee('employee-1')).rejects.toThrow(
      'Resposta inválida',
    );
  });
});
