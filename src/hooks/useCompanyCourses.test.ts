import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCompanyCourses } from '@services/companyCourseService';
import type { CompanyCourse } from '@/types/course';

import { useCompanyCourses } from './useCompanyCourses';

vi.mock('@services/companyCourseService', () => ({ getCompanyCourses: vi.fn() }));

const getCoursesMock = vi.mocked(getCompanyCourses);

const course: CompanyCourse = {
  id: 'course-1',
  title: 'Atendimento de Excelência',
  shortDescription: null,
  thumbnailUrl: null,
  category: null,
  level: null,
  durationTime: null,
  lessonsCount: null,
  instructorName: null,
  rating: null,
  acquiredAt: '2026-10-01',
  employeesWithAccess: 12,
};

const newerCourse: CompanyCourse = { ...course, id: 'course-2', title: 'Gestão de Hotelaria' };

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('useCompanyCourses', () => {
  beforeEach(() => {
    getCoursesMock.mockReset();
  });

  it('does not call the API when disabled', () => {
    const { result } = renderHook(() => useCompanyCourses(false));

    expect(getCoursesMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current.courses).toEqual([]);
  });

  it('loads the courses of the company', async () => {
    getCoursesMock.mockResolvedValueOnce([course]);

    const { result } = renderHook(() => useCompanyCourses(true));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.courses).toEqual([course]);
  });

  it('recovers from an error when reloading', async () => {
    getCoursesMock.mockRejectedValueOnce(new Error('falha')).mockResolvedValueOnce([course]);

    const { result } = renderHook(() => useCompanyCourses(true));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.courses).toEqual([course]);
  });

  it('ignores a stale response that arrives after a newer reload', async () => {
    const first = deferred<CompanyCourse[]>();
    const second = deferred<CompanyCourse[]>();
    getCoursesMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useCompanyCourses(true));
    act(() => result.current.reload());

    await act(async () => {
      second.resolve([newerCourse]);
      await second.promise;
    });
    await waitFor(() => expect(result.current.courses).toEqual([newerCourse]));

    await act(async () => {
      first.resolve([course]);
      await first.promise;
    });

    expect(result.current.courses).toEqual([newerCourse]);
    expect(result.current.status).toBe('success');
  });
});
