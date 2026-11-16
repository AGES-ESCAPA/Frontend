import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch } from '@services/api';
import type { AdminUser } from '@/types/adminUser';
import { AdminUserServiceError, adminUserService } from './adminUserService';

vi.mock('@services/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  authenticatedFetch: vi.fn(),
}));

const authenticatedFetchMock = vi.mocked(authenticatedFetch);

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

describe('adminUserService.list', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset();
  });

  it('should fetch the users from the admin endpoint', async () => {
    authenticatedFetchMock.mockResolvedValue(jsonResponse({ success: true, data: users }));

    const result = await adminUserService.list();

    expect(result).toEqual(users);
    const [url] = authenticatedFetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toMatch(/\/users$/);
  });

  it('should throw with the API message when the response is not ok', async () => {
    authenticatedFetchMock.mockResolvedValue(
      jsonResponse(
        { status: 403, error: 'Forbidden', message: 'Access denied: user is not ADMIN' },
        403,
      ),
    );

    const error = await adminUserService.list().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminUserServiceError);
    expect((error as AdminUserServiceError).status).toBe(403);
    expect((error as AdminUserServiceError).message).toBe('Access denied: user is not ADMIN');
  });

  it('should report a network failure with status 0', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await adminUserService.list().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AdminUserServiceError);
    expect((error as AdminUserServiceError).status).toBe(0);
    expect((error as AdminUserServiceError).message).toContain('conexão');
  });
});
