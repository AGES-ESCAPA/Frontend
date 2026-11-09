import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyEmployeeService } from '@services/companyEmployeeService';
import type { CompanyEmployeePage } from '@/types/companyEmployee';
import { useCompanyEmployees } from './useCompanyEmployees';

vi.mock('@services/companyEmployeeService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  companyEmployeeService: {
    getSeats: vi.fn(),
    listEmployees: vi.fn(),
  },
}));

const listMock = vi.mocked(companyEmployeeService.listEmployees);

const emptyPage: CompanyEmployeePage = {
  content: [],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
};

function defer<T>() {
  let resolve!: (result: T) => void;

  const promise = new Promise<T>((callback) => {
    resolve = callback;
  });

  return { promise, resolve };
}

describe('useCompanyEmployees', () => {
  beforeEach(() => listMock.mockReset());

  it('carrega e atualiza os dados após reload', async () => {
    listMock.mockResolvedValue(emptyPage);

    const { result } = renderHook(() => useCompanyEmployees('', 0));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(listMock).toHaveBeenCalledTimes(1);

    act(() => result.current.reload());

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
  });

  it('não deixa uma resposta antiga sobrescrever uma nova pesquisa', async () => {
    const oldRequest = defer<CompanyEmployeePage>();
    const newRequest = defer<CompanyEmployeePage>();

    listMock.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);

    const { result, rerender } = renderHook(({ search }) => useCompanyEmployees(search, 0), {
      initialProps: { search: 'ana' },
    });

    rerender({ search: 'carlos' });

    await act(async () => {
      newRequest.resolve({
        ...emptyPage,
        totalElements: 1,
        totalPages: 1,
      });

      await newRequest.promise;
    });

    expect(result.current.totalElements).toBe(1);

    await act(async () => {
      oldRequest.resolve({
        ...emptyPage,
        totalElements: 100,
      });

      await oldRequest.promise;
    });

    expect(result.current.totalElements).toBe(1);
  });

  it('indica erro e permite nova tentativa', async () => {
    listMock.mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValue(emptyPage);

    const { result } = renderHook(() => useCompanyEmployees('', 0));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.errorMessage).toBe('Falha de rede');

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
