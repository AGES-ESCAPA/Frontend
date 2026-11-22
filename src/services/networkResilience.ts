/**
 * Helpers de resiliência de rede para a plataforma online-first.
 * Pequenas instabilidades (falha transitória, 5xx) são reintentadas
 * transparentemente antes de chegar à UI.
 */

/** Status HTTP em que vale a pena repetir um GET/HEAD. */
export const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export const isAbortError = (error: unknown, signal?: AbortSignal | null): boolean =>
  Boolean(signal?.aborted) || (error instanceof DOMException && error.name === 'AbortError');

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  return /failed to fetch|networkerror|load failed|network request failed/i.test(error.message);
};

/** Erros com `status` 0 (padrão dos services) ou sem status HTTP. */
export const isTransientServiceError = (error: unknown): boolean => {
  if (isNetworkError(error)) return true;
  if (error !== null && typeof error === 'object' && 'status' in error) {
    const { status } = error as { status?: unknown };
    if (status === 0 || status === null || status === undefined) return true;
    if (typeof status === 'number' && RETRYABLE_HTTP_STATUS.has(status)) return true;
  }
  return false;
};

export const sleep = (ms: number, signal?: AbortSignal | null): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (attempt: number, error: unknown) => boolean;
}

/**
 * Executa `operation` com backoff exponencial. Respeita `AbortSignal`.
 * Por padrão tenta até 3 vezes (1 + 2 retries).
 */
export const withRetry = async <T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) {
      throw options.signal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    try {
      return await operation(attempt);
    } catch (error: unknown) {
      lastError = error;
      if (isAbortError(error, options.signal)) throw error;

      const canRetry =
        attempt < maxAttempts &&
        (options.shouldRetry?.(attempt, error) ?? isTransientServiceError(error));

      if (!canRetry) throw error;

      await sleep(baseDelayMs * 2 ** (attempt - 1), options.signal);
    }
  }

  throw lastError;
};

const resolveMethod = (init?: RequestInit): string => (init?.method ?? 'GET').toUpperCase();

export const isIdempotentMethod = (init?: RequestInit): boolean => {
  const method = resolveMethod(init);
  return method === 'GET' || method === 'HEAD';
};

/**
 * `fetch` com retry automático só para métodos idempotentes (GET/HEAD).
 * Usado por rotas públicas que não passam por `authenticatedFetch`.
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<Response> => {
  const maxAttempts = isIdempotentMethod(init) ? (options.maxAttempts ?? 3) : 1;
  const baseDelayMs = options.baseDelayMs ?? 200;
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (init.signal?.aborted) {
      throw init.signal.reason ?? new DOMException('Aborted', 'AbortError');
    }

    try {
      const response = await fetch(input, init);

      if (
        attempt < maxAttempts &&
        RETRYABLE_HTTP_STATUS.has(response.status) &&
        !init.signal?.aborted
      ) {
        lastResponse = response;
        await sleep(baseDelayMs * 2 ** (attempt - 1), init.signal);
        continue;
      }

      return response;
    } catch (error: unknown) {
      lastError = error;
      if (isAbortError(error, init.signal) || attempt >= maxAttempts) throw error;
      await sleep(baseDelayMs * 2 ** (attempt - 1), init.signal);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError;
};
