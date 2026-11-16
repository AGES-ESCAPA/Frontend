import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyReportService } from '@services/companyReportService';
import type { EmployeeProgressPage, EmployeeProgressStatus } from '@/types/companyReport';
import { useEmployeeProgress } from './useEmployeeProgress';

vi.mock('@services/companyReportService', () => ({
  companyReportService: {
    getOverview: vi.fn(),
    listEmployeeProgress: vi.fn(),
  },
}));

const listMock = vi.mocked(companyReportService.listEmployeeProgress);

const pageOf = (name: string, totalElements = 1): EmployeeProgressPage => ({
  content: [
    {
      userId: name,
      name,
      avatarUrl: null,
      courseId: 'course-1',
      course: 'Curso',
      progress: 50,
      lastAccessAt: null,
      certificateIssued: false,
    },
  ],
  pageNumber: 0,
  pageSize: 8,
  totalElements,
  totalPages: Math.ceil(totalElements / 8),
});

function defer<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
}

interface Props {
  search: string;
  status: EmployeeProgressStatus | null;
  page: number;
}

describe('useEmployeeProgress', () => {
  beforeEach(() => listMock.mockReset());

  it('sends the search, status and page to the service and exposes the page', async () => {
    listMock.mockResolvedValueOnce(pageOf('Ana', 20));

    const { result } = renderHook(() => useEmployeeProgress('ana', 'COMPLETED', 1));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(listMock).toHaveBeenCalledWith(
      { search: 'ana', status: 'COMPLETED' },
      1,
      expect.any(AbortSignal),
    );
    expect(result.current.rows.map((row) => row.name)).toEqual(['Ana']);
    expect(result.current.totalElements).toBe(20);
    expect(result.current.totalPages).toBe(3);
  });

  it('does not let an old response overwrite the current filters', async () => {
    const oldRequest = defer<EmployeeProgressPage>();
    const newRequest = defer<EmployeeProgressPage>();
    listMock.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);

    const { result, rerender } = renderHook(
      (props: Props) => useEmployeeProgress(props.search, props.status, props.page),
      {
        initialProps: { search: '', status: null, page: 0 } as Props,
      },
    );
    const firstSignal = listMock.mock.calls[0][2];

    rerender({ search: '', status: 'IN_PROGRESS', page: 0 });
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => newRequest.resolve(pageOf('Nova')));
    await act(async () => oldRequest.resolve(pageOf('Antiga')));

    expect(result.current.rows.map((row) => row.name)).toEqual(['Nova']);
  });

  it('clears the rows and exposes the message on failure, then retries on reload', async () => {
    listMock.mockRejectedValueOnce(new Error('Sem conexão.')).mockResolvedValueOnce(pageOf('Ana'));

    const { result } = renderHook(() => useEmployeeProgress('', null, 0));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Sem conexão.');
    expect(result.current.rows).toEqual([]);
    expect(result.current.totalElements).toBe(0);

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(listMock).toHaveBeenCalledTimes(2);
  });
});
