import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { profileService } from '@services/profileService';
import type { UserProfile } from '@/types/profile';
import { useProfile } from './useProfile';

vi.mock('@services/profileService', () => ({
  profileService: { getProfile: vi.fn() },
}));

const getProfileMock = vi.mocked(profileService.getProfile);

const student: UserProfile = {
  profile: 'STUDENT',
  editable: true,
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  cpf: '39011122233',
  phone: '51991203344',
  companyName: null,
  cnpj: null,
  avatarUrl: null,
};

describe('useProfile', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts loading and then exposes the profile', async () => {
    getProfileMock.mockResolvedValue(student);

    const { result } = renderHook(() => useProfile());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.profile).toEqual(student);
    expect(getProfileMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('exposes the error message when the profile cannot be loaded', async () => {
    getProfileMock.mockRejectedValue(new Error('Não foi possível carregar seus dados.'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('Não foi possível carregar seus dados.');
  });

  it('loads again when reload is called after an error', async () => {
    getProfileMock.mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValue(student);
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getProfileMock).toHaveBeenCalledTimes(2);
  });

  it('aborts the request when the component unmounts', () => {
    getProfileMock.mockReturnValue(new Promise(() => undefined));
    const { unmount } = renderHook(() => useProfile());
    const signal = getProfileMock.mock.calls[0][0] as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
