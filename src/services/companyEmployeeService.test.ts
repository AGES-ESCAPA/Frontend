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
