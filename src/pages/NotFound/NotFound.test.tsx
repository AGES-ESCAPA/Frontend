import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AuthUser } from '@/types/auth';
import { NotFound } from './NotFound';

const authState: { user: AuthUser | null } = { user: null };

vi.mock('@contexts/useAuth', () => ({
  useAuth: () => ({
    user: authState.user,
    isRestoring: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound />
    </MemoryRouter>,
  );

describe('NotFound', () => {
  beforeEach(() => {
    authState.user = null;
  });

  it('should explain that the page does not exist and link back home', () => {
    renderPage('/pagina-inexistente-xyz');

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByText(/não existe ou foi removido/i)).toBeInTheDocument();
    expect(screen.getByText('/pagina-inexistente-xyz')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('heading', { name: 'Página em construção' })).not.toBeInTheDocument();
  });

  it('should send an authenticated company user to the company home', () => {
    authState.user = {
      id: 'company-1',
      name: 'Empresa',
      email: 'empresa@email.com',
      role: 'COMPANY',
    };

    renderPage('/rota-errada');

    expect(screen.getByRole('link', { name: 'Ir para a área inicial' })).toHaveAttribute(
      'href',
      '/empresa/cursos',
    );
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});
