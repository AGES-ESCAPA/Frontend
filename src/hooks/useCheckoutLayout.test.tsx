import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthUser } from '@/types/auth';
import { getCheckoutRole, useCheckoutLayout } from './useCheckoutLayout';

const user: AuthUser = {
  id: 'b0000000-0000-4000-b000-000000000002',
  name: 'João Pedro Alves',
  email: 'joao.alves@email.com',
  role: 'STUDENT',
  avatarUrl: 'https://cdn.escapa.com.br/avatars/joao.png',
};

const wrapperFor =
  (path: string, sessionUser: AuthUser | null) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider
      value={{
        user: sessionUser,
        isAuthenticated: sessionUser !== null,
        isRestoring: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </AuthContext.Provider>
  );

describe('getCheckoutRole', () => {
  it('should treat routes under /empresa as company and everything else as student', () => {
    expect(getCheckoutRole('/empresa/checkout/abc')).toBe('company');
    expect(getCheckoutRole('/checkout/abc')).toBe('student');
    expect(getCheckoutRole('/checkout/confirmacao')).toBe('student');
  });
});

describe('useCheckoutLayout', () => {
  it('should build the student layout with "Cursos" active and the student catalog', () => {
    const { result } = renderHook(() => useCheckoutLayout(), {
      wrapper: wrapperFor('/checkout/abc', null),
    });

    expect(result.current.role).toBe('student');
    expect(result.current.catalogPath).toBe('/aluno/cursos');
    expect(result.current.menuItems.map((item) => item.label)).toEqual([
      'Cursos',
      'Meus Cursos',
      'Meu Perfil',
    ]);
    expect(result.current.menuItems.filter((item) => item.active)).toHaveLength(1);
    expect(result.current.menuItems[0].active).toBe(true);
  });

  it('should build the company layout and the company catalog', () => {
    const { result } = renderHook(() => useCheckoutLayout(), {
      wrapper: wrapperFor('/empresa/checkout/abc', null),
    });

    expect(result.current.role).toBe('company');
    expect(result.current.catalogPath).toBe('/empresa/cursos');
    expect(result.current.menuItems.map((item) => item.label)).toContain('Colaboradores');
  });

  it('should use the sample user when there is no session', () => {
    const { result } = renderHook(() => useCheckoutLayout(), {
      wrapper: wrapperFor('/checkout/abc', null),
    });

    expect(result.current.user.name).toBe('Jorge Amado');
  });

  it('should use the logged user, with the label of the profile of the route', () => {
    const { result } = renderHook(() => useCheckoutLayout(), {
      wrapper: wrapperFor('/checkout/abc', user),
    });

    expect(result.current.user).toEqual({
      name: 'João Pedro Alves',
      role: 'Aluno',
      email: 'joao.alves@email.com',
      avatarUrl: 'https://cdn.escapa.com.br/avatars/joao.png',
    });
  });

  it('should leave the avatar out when the user has none', () => {
    const { result } = renderHook(() => useCheckoutLayout(), {
      wrapper: wrapperFor('/empresa/checkout/abc', { ...user, avatarUrl: null, role: 'COMPANY' }),
    });

    expect(result.current.user).toEqual({
      name: 'João Pedro Alves',
      role: 'Empresa',
      email: 'joao.alves@email.com',
    });
  });
});
