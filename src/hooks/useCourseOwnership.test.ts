import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCompanyOwnedCourseIds, loadOwnedCourseIds } from '@utils/ownedCourses';
import { useCourseOwnership } from './useCourseOwnership';

vi.mock('@utils/ownedCourses', () => ({
  loadOwnedCourseIds: vi.fn(),
  loadCompanyOwnedCourseIds: vi.fn(),
}));

const loadOwnedCourseIdsMock = vi.mocked(loadOwnedCourseIds);
const loadCompanyOwnedCourseIdsMock = vi.mocked(loadCompanyOwnedCourseIds);

describe('useCourseOwnership', () => {
  beforeEach(() => {
    loadOwnedCourseIdsMock.mockReset();
    loadCompanyOwnedCourseIdsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips loading when disabled', async () => {
    const { result } = renderHook(() => useCourseOwnership('course-1', false));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.owned).toBe(false);
    expect(loadOwnedCourseIdsMock).not.toHaveBeenCalled();
  });

  it('skips loading when courseId is empty', async () => {
    const { result } = renderHook(() => useCourseOwnership('', true));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.owned).toBe(false);
    expect(loadOwnedCourseIdsMock).not.toHaveBeenCalled();
  });

  it('reports ownership for a student course', async () => {
    loadOwnedCourseIdsMock.mockResolvedValue(new Set(['course-1', 'course-2']));

    const { result } = renderHook(() => useCourseOwnership('course-2', true));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.owned).toBe(true);
    expect(loadOwnedCourseIdsMock).toHaveBeenCalledTimes(1);
  });

  it('loads company-owned courses when source is company', async () => {
    loadCompanyOwnedCourseIdsMock.mockResolvedValue(new Set(['company-course']));

    const { result } = renderHook(() => useCourseOwnership('company-course', true, 'company'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.owned).toBe(true);
    expect(loadCompanyOwnedCourseIdsMock).toHaveBeenCalledTimes(1);
    expect(loadOwnedCourseIdsMock).not.toHaveBeenCalled();
  });

  it('treats failures as not owned with error status', async () => {
    loadOwnedCourseIdsMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useCourseOwnership('course-1', true));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.owned).toBe(false);
  });
});
