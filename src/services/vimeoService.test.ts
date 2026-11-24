import { afterEach, describe, expect, it, vi } from 'vitest';
import { getVimeoVideoDuration } from './vimeoService';

const VIDEO_URL = 'https://vimeo.com/123456789';
const GENERIC_ERROR = 'Não foi possível obter os dados do vídeo no Vimeo.';

describe('vimeoService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should return the duration from a successful oEmbed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ duration: 320 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getVimeoVideoDuration(VIDEO_URL)).resolves.toBe(320);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://vimeo.com/api/oembed.json?${new URLSearchParams({ url: VIDEO_URL })}`,
    );
    expect(init.signal).toBeUndefined();
  });

  it('should forward the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ duration: 90 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getVimeoVideoDuration(VIDEO_URL, controller.signal);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
  });

  it('should throw when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(getVimeoVideoDuration(VIDEO_URL)).rejects.toThrow(GENERIC_ERROR);
  });

  it.each([
    ['missing', {}],
    ['zero', { duration: 0 }],
    ['negative', { duration: -10 }],
    ['non-number', { duration: '120' }],
  ])('should throw when duration is invalid (%s)', async (_label, payload) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      }),
    );

    await expect(getVimeoVideoDuration(VIDEO_URL)).rejects.toThrow(GENERIC_ERROR);
  });
});
