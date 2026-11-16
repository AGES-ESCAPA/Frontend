import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminUserService } from '@services/adminUserService';
import type { AdminUser } from '@/types/adminUser';
import { useAdminUsers } from './useAdminUsers';

vi.mock('@services/adminUserService', () => ({
  adminUserService: {
    list: vi.fn(),
  },
}));

const listMock = vi.mocked(adminUserService.list);

const users: AdminUser[] = [
  {
    id: 'user-1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    userType: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-17T12:00:00',
  },
];

describe('useAdminUsers', () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it('should load the users', async () => {
    listMock.mockResolvedValue(users);

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.users).toEqual(users);
    expect(listMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('should expose an error state and allow retry', async () => {
    listMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('network');
    expect(result.current.users).toEqual([]);

    listMock.mockResolvedValue(users);
    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.users).toEqual(users);
  });
});
