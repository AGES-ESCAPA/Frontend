import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { AuthServiceError, authService } from '@services/authService';
import { useAccountInvite } from './useAccountInvite';

const invite = {
  name: 'Felipe Andrade',
  email: 'felipe.andrade@vistamar.com.br',
  companyName: 'Pousada Vista Mar LTDA',
};

describe('useAccountInvite', () => {
  let getInviteMock: MockInstance<typeof authService.getInvite>;

  beforeEach(() => {
    getInviteMock = vi.spyOn(authService, 'getInvite');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the invite of the token', async () => {
    getInviteMock.mockResolvedValue(invite);

    const { result } = renderHook(() => useAccountInvite('convite-1'));

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(getInviteMock).toHaveBeenCalledWith('convite-1', expect.any(AbortSignal));
    expect(result.current.invite).toEqual(invite);
  });

  it.each([404, 410] as const)('exposes the %i status of the invite', async (status) => {
    getInviteMock.mockRejectedValue(new AuthServiceError(status, 'Invite error'));

    const { result } = renderHook(() => useAccountInvite('convite-1'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.errorStatus).toBe(status);
    expect(result.current.invite).toBeNull();
  });

  it('exposes a network failure without an invite status', async () => {
    getInviteMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useAccountInvite('convite-1'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.errorStatus).toBeNull();
    expect(result.current.errorMessage).toBe('Failed to fetch');
  });

  it('treats a link without token as invalid without calling the API', () => {
    const { result } = renderHook(() => useAccountInvite(''));

    expect(result.current.status).toBe('error');
    expect(result.current.errorStatus).toBe(404);
    expect(getInviteMock).not.toHaveBeenCalled();
  });
});
