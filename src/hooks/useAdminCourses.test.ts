import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService } from '@services/courseService';
import type { AdminCourseListItem } from '@/types/course';
import { useAdminCourses } from './useAdminCourses';

vi.mock('@services/courseService', () => ({
  courseService: {
    listAdminCourses: vi.fn(),
    archiveCourse: vi.fn(),
    unarchiveCourse: vi.fn(),
  },
}));

const listAdminCoursesMock = vi.mocked(courseService.listAdminCourses);
const archiveCourseMock = vi.mocked(courseService.archiveCourse);
const unarchiveCourseMock = vi.mocked(courseService.unarchiveCourse);

const apiItem: AdminCourseListItem = {
  id: 'e0000000-0000-4000-e000-000000000001',
  title: 'Atendimento de Excelencia em Hospedagem',
  category: 'Hospitalidade',
  price: 249.9,
  status: 'PUBLISHED',
  majorVersion: 1,
  minorVersion: 2,
};

describe('useAdminCourses', () => {
  beforeEach(() => {
    listAdminCoursesMock.mockReset();
    archiveCourseMock.mockReset();
    unarchiveCourseMock.mockReset();
  });

  it('should map listed courses into table rows', async () => {
    listAdminCoursesMock.mockResolvedValue([apiItem]);

    const { result } = renderHook(() => useAdminCourses());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.courses).toEqual([
      {
        id: apiItem.id,
        code: 'AE',
        title: apiItem.title,
        category: 'Hospitalidade',
        price: 249.9,
        status: 'PUBLISHED',
        version: 'v1.2',
      },
    ]);
  });

  it('should expose an error state and allow retry', async () => {
    listAdminCoursesMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdminCourses());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('network');

    listAdminCoursesMock.mockResolvedValue([apiItem]);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.courses).toHaveLength(1);
  });

  it('should mark the archived course as ARCHIVED in the local list', async () => {
    listAdminCoursesMock.mockResolvedValue([apiItem]);
    archiveCourseMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdminCourses());
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.archiveCourse(apiItem.id);
    });

    expect(archiveCourseMock).toHaveBeenCalledWith(apiItem.id);
    expect(result.current.courses).toEqual([
      expect.objectContaining({ id: apiItem.id, status: 'ARCHIVED' }),
    ]);
  });

  it('should mark the unarchived course as PUBLISHED in the local list', async () => {
    listAdminCoursesMock.mockResolvedValue([{ ...apiItem, status: 'ARCHIVED' }]);
    unarchiveCourseMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdminCourses());
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.unarchiveCourse(apiItem.id);
    });

    expect(unarchiveCourseMock).toHaveBeenCalledWith(apiItem.id);
    expect(result.current.courses).toEqual([
      expect.objectContaining({ id: apiItem.id, status: 'PUBLISHED' }),
    ]);
  });
});
