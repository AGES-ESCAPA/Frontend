import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getVimeoVideoDuration } from '@services/vimeoService';
import { useVimeoDuration } from './useVimeoDuration';

vi.mock('@services/vimeoService', () => ({
  getVimeoVideoDuration: vi.fn(),
}));

const getVimeoVideoDurationMock = vi.mocked(getVimeoVideoDuration);

describe('useVimeoDuration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should deliver the duration of a Vimeo video', async () => {
    getVimeoVideoDurationMock.mockResolvedValue(760);
    const onDuration = vi.fn();

    const { result } = renderHook(() =>
      useVimeoDuration('https://vimeo.com/123456789', true, onDuration),
    );

    await waitFor(() => expect(result.current).toBe('success'));
    expect(onDuration).toHaveBeenCalledWith(760);
    expect(getVimeoVideoDurationMock).toHaveBeenCalledWith(
      'https://vimeo.com/123456789',
      expect.any(AbortSignal),
    );
  });

  it('should not query URLs from other providers or when disabled', async () => {
    const { result, rerender } = renderHook(
      ({ url, enabled }) => useVimeoDuration(url, enabled, vi.fn()),
      { initialProps: { url: 'https://youtube.com/watch?v=abc', enabled: true } },
    );

    rerender({ url: 'https://vimeo.com/123456789', enabled: false });

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(result.current).toBe('idle');
    expect(getVimeoVideoDurationMock).not.toHaveBeenCalled();
  });

  it('should only query the last URL typed', async () => {
    getVimeoVideoDurationMock.mockResolvedValue(90);

    const { result, rerender } = renderHook(({ url }) => useVimeoDuration(url, true, vi.fn()), {
      initialProps: { url: 'https://vimeo.com/1' },
    });

    rerender({ url: 'https://vimeo.com/12' });
    rerender({ url: 'https://vimeo.com/123' });

    await waitFor(() => expect(result.current).toBe('success'));
    expect(getVimeoVideoDurationMock).toHaveBeenCalledOnce();
    expect(getVimeoVideoDurationMock).toHaveBeenCalledWith(
      'https://vimeo.com/123',
      expect.any(AbortSignal),
    );
  });

  it('should report the error so the duration is typed manually', async () => {
    getVimeoVideoDurationMock.mockRejectedValue(new Error('Vídeo privado.'));
    const onDuration = vi.fn();

    const { result } = renderHook(() =>
      useVimeoDuration('https://vimeo.com/123456789', true, onDuration),
    );

    await waitFor(() => expect(result.current).toBe('error'));
    expect(onDuration).not.toHaveBeenCalled();
  });
});
