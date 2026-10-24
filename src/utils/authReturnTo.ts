export const PURCHASE_REDIRECT_KEY = 'escapa:purchase-redirect';
export const STUDENT_HOME = '/aluno/cursos';

export const safeAuthReturnTo = (value: unknown): string | undefined => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\s]/.test(value)
  )
    return undefined;
  const url = new URL(value, 'https://escapa.invalid');
  if (url.origin !== 'https://escapa.invalid' || /^\/(?:login|cadastro)(?:\/|$)/.test(url.pathname))
    return undefined;
  return `${url.pathname}${url.search}${url.hash}`;
};

export const getAuthReturnTo = (state: unknown, search: string): string | undefined => {
  const stateReturnTo =
    state !== null && typeof state === 'object' && 'returnTo' in state ? state.returnTo : undefined;
  return (
    safeAuthReturnTo(stateReturnTo) ??
    safeAuthReturnTo(new URLSearchParams(search).get('returnTo')) ??
    safeAuthReturnTo(localStorage.getItem(PURCHASE_REDIRECT_KEY))
  );
};

export const authPath = (path: string, returnTo: string | undefined): string =>
  returnTo === undefined ? path : `${path}?${new URLSearchParams({ returnTo })}`;
