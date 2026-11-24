import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl } from './runtimeEnv';

describe('runtimeEnv', () => {
  afterEach(() => {
    delete window.__ENV__;
    vi.unstubAllEnvs();
  });

  it('uses the runtime URL injected in window.__ENV__', () => {
    window.__ENV__ = { VITE_API_BASE_URL: 'https://api.escapa.com/v1' };

    expect(getApiBaseUrl()).toBe('https://api.escapa.com/v1');
  });

  it('ignores placeholder runtime values and falls back to import.meta.env', () => {
    window.__ENV__ = { VITE_API_BASE_URL: '${VITE_API_BASE_URL}' };

    expect(getApiBaseUrl()).toBe('http://localhost:8080/api/v1');
  });
});
