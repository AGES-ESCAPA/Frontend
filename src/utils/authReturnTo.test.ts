import { authPath, getAuthReturnTo, PURCHASE_REDIRECT_KEY, safeAuthReturnTo } from './authReturnTo';

describe('authReturnTo', () => {
  afterEach(() => localStorage.clear());
  it('prioritizes state, query string and then the pending purchase', () => {
    localStorage.setItem(PURCHASE_REDIRECT_KEY, '/cursos/saved');
    expect(
      getAuthReturnTo({ returnTo: '/checkout/from-state' }, '?returnTo=%2Fcursos%2Ffrom-query'),
    ).toBe('/checkout/from-state');
    expect(getAuthReturnTo(null, '?returnTo=%2Fcursos%2Ffrom-query')).toBe('/cursos/from-query');
    expect(getAuthReturnTo(null, '')).toBe('/cursos/saved');
  });
  it.each([
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login',
    '/cadastro/usuario',
    '/foo/../login',
    '/cursos/1\n',
  ])('ignores unsafe or cyclic destinations: %s', (path) => {
    expect(safeAuthReturnTo(path)).toBeUndefined();
  });
  it('preserves the search and fragment and encodes them through the registration flow', () => {
    const destination = '/cursos/1?turma=2#conteudo';
    expect(safeAuthReturnTo(destination)).toBe(destination);
    expect(getAuthReturnTo(null, authPath('/cadastro', destination).split('?')[1])).toBe(
      destination,
    );
    expect(authPath('/cadastro', undefined)).toBe('/cadastro');
  });
});
