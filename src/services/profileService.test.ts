import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileServiceError, profileService } from './profileService';

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true, data }),
});

const errorResponse = (status: number, message: string) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ status, message }),
});

const studentResponse = {
  profile: 'STUDENT',
  editable: true,
  name: 'Mariana Costa',
  email: 'mariana@email.com',
  cpf: '39011122233',
  phone: '51991203344',
};

describe('profileService', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads the profile with the access token and fills the fields omitted by the API with null', async () => {
    localStorage.setItem('access_token', 'jwt-token');
    const fetchMock = vi.fn().mockResolvedValue(okResponse(studentResponse));
    vi.stubGlobal('fetch', fetchMock);

    await expect(profileService.getProfile()).resolves.toEqual({
      ...studentResponse,
      companyName: null,
      cnpj: null,
      avatarUrl: null,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/me\/profile$/);
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer jwt-token');
  });

  it('rejects a response with an unknown profile type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okResponse({ ...studentResponse, profile: 'GUEST' })),
    );

    await expect(profileService.getProfile()).rejects.toMatchObject({
      name: 'ProfileServiceError',
      message: 'A resposta do perfil contém um tipo de perfil inválido.',
    });
  });

  it('sends only the editable fields in the PUT body and returns the updated profile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ ...studentResponse, name: 'Mariana Souza' }));
    vi.stubGlobal('fetch', fetchMock);

    const updated = await profileService.updateProfile({
      name: 'Mariana Souza',
      phone: '54999998888',
    });

    expect(updated.name).toBe('Mariana Souza');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/me\/profile$/);
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ name: 'Mariana Souza', phone: '54999998888' }));
  });

  it('surfaces the status and the backend message of a rejected update', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(400, 'phone is invalid')));

    const request = profileService.updateProfile({ name: 'Mariana', phone: '123' });

    await expect(request).rejects.toBeInstanceOf(ProfileServiceError);
    await expect(request).rejects.toMatchObject({ status: 400, message: 'phone is invalid' });
  });

  it('uploads the photo as multipart form data and returns the new avatar URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ avatarUrl: 'http://minio/avatars/nova.png' }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['img'], 'foto.png', { type: 'image/png' });

    await expect(profileService.uploadAvatar(file)).resolves.toBe('http://minio/avatars/nova.png');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/me\/avatar$/);
    expect(init.method).toBe('PUT');
    expect((init.body as FormData).get('file')).toBe(file);
    expect(new Headers(init.headers).get('content-type')).toBeNull();
  });

  it('posts the current password to deactivate the account', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await profileService.deactivateAccount('escapa@2026');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/me\/deactivate$/);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ currentPassword: 'escapa@2026' }));
  });

  it('rejects the deactivation with the backend message when the password is wrong', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(400, 'Current password is incorrect')),
    );

    await expect(profileService.deactivateAccount('errada')).rejects.toMatchObject({
      status: 400,
      message: 'Current password is incorrect',
    });
  });

  describe('changePassword', () => {
    it('puts the current and the new password with the access token', async () => {
      localStorage.setItem('access_token', 'jwt-token');
      const fetchMock = vi.fn().mockResolvedValue(okResponse(null));
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        profileService.changePassword('escapa@2026', 'nova@senha2026'),
      ).resolves.toBeUndefined();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/me\/password$/);
      expect(init.method).toBe('PUT');
      expect(init.body).toBe(
        JSON.stringify({ currentPassword: 'escapa@2026', newPassword: 'nova@senha2026' }),
      );
      expect(new Headers(init.headers).get('authorization')).toBe('Bearer jwt-token');
    });

    it('rejects with status 400 and the backend message when the current password is wrong', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(400, 'Current password is incorrect')),
      );

      const request = profileService.changePassword('errada', 'nova@senha2026');

      await expect(request).rejects.toBeInstanceOf(ProfileServiceError);
      await expect(request).rejects.toMatchObject({
        status: 400,
        message: 'Current password is incorrect',
      });
    });

    it('rejects with status 400 and the backend message when the new password is weak', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(errorResponse(400, 'Password must be at least 8 characters')),
      );

      await expect(profileService.changePassword('escapa@2026', '123')).rejects.toMatchObject({
        status: 400,
        message: 'Password must be at least 8 characters',
      });
    });

    it('propagates the network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      await expect(
        profileService.changePassword('escapa@2026', 'nova@senha2026'),
      ).rejects.toBeInstanceOf(TypeError);
    });
  });
});
