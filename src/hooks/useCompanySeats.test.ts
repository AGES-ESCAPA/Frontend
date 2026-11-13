import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyEmployeeService } from '@services/companyEmployeeService';
import { useCompanySeats } from './useCompanySeats';

vi.mock('@services/companyEmployeeService', () => ({
  companyEmployeeService: {
    getSeats: vi.fn(),
  },
}));

const getSeatsMock = vi.mocked(companyEmployeeService.getSeats);

const seats = {
  seatsTotal: 10,
  seatsUsed: 9,
  seatsAvailable: 1,
  employeesTotal: 9,
  employeesActive: 6,
};

describe('useCompanySeats', () => {
  beforeEach(() => getSeatsMock.mockReset());

  it('carrega vagas da empresa e permite atualizar', async () => {
    getSeatsMock.mockResolvedValue(seats);

    const { result } = renderHook(() => useCompanySeats());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.seats).toEqual(seats);

    act(() => result.current.reload());

    await waitFor(() => expect(getSeatsMock).toHaveBeenCalledTimes(2));
  });

  it('exibe erro e recupera após nova tentativa', async () => {
    getSeatsMock.mockRejectedValueOnce(new Error('Erro ao carregar')).mockResolvedValue(seats);

    const { result } = renderHook(() => useCompanySeats());

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.errorMessage).toBe('Erro ao carregar');

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('aplica vagas devolvidas pela desvinculação e ignora uma consulta antiga', async () => {
    let resolveOld!: (value: typeof seats) => void;

    getSeatsMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );

    const { result } = renderHook(() => useCompanySeats());
    const updated = { ...seats, seatsUsed: 8, seatsAvailable: 2 };

    act(() => result.current.applySeats(updated));

    expect(result.current.seats).toEqual(updated);
    expect(result.current.status).toBe('success');

    await act(async () => resolveOld(seats));

    expect(result.current.seats).toEqual(updated);
  });
});
