import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { authService } from '@services/authService';
import type { AuthUser } from '@/types/auth';
import { AppRouter } from './AppRouter';
import type * as Recharts from 'recharts';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));
vi.mock('@pages/Login/Login', async () => {
  const { useLocation } = await import('react-router-dom');
  return {
    Login: () => {
      const location = useLocation();
      const state = location.state as { returnTo?: string } | null;
      return <p>Login: {state?.returnTo}</p>;
    },
  };
});
vi.mock('@pages/MyCourses/MyCourses', () => ({ MyCourses: () => <h1>Meus cursos</h1> }));
vi.mock('@pages/CompanyEmployees/CompanyEmployees', () => ({
  CompanyEmployees: () => <h1>Gestão de Funcionários</h1>,
}));
vi.mock('@pages/AdminCourses/AdminCourses', () => ({
  AdminCourses: () => <h1>Gestão de Cursos</h1>,
}));
vi.mock('@pages/UnderConstruction/UnderConstruction', () => ({
  UnderConstruction: () => <h1>Página em construção</h1>,
}));

const admin: AuthUser = {
  id: 'admin-1',
  name: 'Administrador de teste',
  email: 'admin@example.com',
  role: 'ADMIN',
};
const restoreSession = (user: AuthUser) => {
  localStorage.setItem('access_token', 'test-token');
  vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(user);
};

describe('AppRouter — /admin/metricas', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/admin/metricas');
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('renders metrics for an authenticated administrator instead of the admin fallback', async () => {
    restoreSession(admin);
    render(<AppRouter />);
    expect(
      await screen.findByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/metricas');
    expect(screen.queryByRole('heading', { name: 'Página em construção' })).not.toBeInTheDocument();
    expect(authService.getCurrentUser).toHaveBeenCalledWith('test-token');
    expect(screen.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toBeInTheDocument();
  });

  it('redirects anonymous visitors to login and preserves the requested URL', async () => {
    window.history.replaceState(null, '', '/admin/metricas?periodo=6#evolucao');
    render(<AppRouter />);
    expect(
      await screen.findByText('Login: /admin/metricas?periodo=6#evolucao'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(
      screen.queryByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['STUDENT', '/meus-cursos'],
    ['EMPLOYEE', '/meus-cursos'],
    ['COMPANY', '/empresa/colaboradores'],
  ] as const)('denies the %s profile and redirects to %s', async (role, destination) => {
    restoreSession({ ...admin, role });
    render(<AppRouter />);
    await waitFor(() => expect(window.location.pathname).toBe(destination));
    expect(
      await screen.findByRole('heading', {
        name: role === 'COMPANY' ? 'Gestão de Funcionários' : 'Meus cursos',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).not.toBeInTheDocument();
  });

  it('waits for session restoration before showing metrics or redirecting', () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(new Promise<AuthUser>(() => {}));
    render(<AppRouter />);
    expect(screen.getByRole('status', { name: 'Restaurando sessão' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/metricas');
    expect(
      screen.queryByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).not.toBeInTheDocument();
  });
});

describe('AppRouter — /empresa/dashboard', () => {
  const company: AuthUser = { ...admin, id: 'company-1', role: 'COMPANY' };

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/empresa/dashboard');
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('renders the engagement dashboard for a company instead of the company fallback', async () => {
    restoreSession(company);
    render(<AppRouter />);
    expect(
      await screen.findByRole('heading', { name: 'Dashboard de Engajamento' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/empresa/dashboard');
    expect(screen.queryByRole('heading', { name: 'Página em construção' })).not.toBeInTheDocument();
  });

  it('redirects anonymous visitors to login and preserves the requested URL', async () => {
    render(<AppRouter />);
    expect(await screen.findByText('Login: /empresa/dashboard')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it.each([
    ['ADMIN', '/admin/cursos', 'Gestão de Cursos'],
    ['STUDENT', '/meus-cursos', 'Meus cursos'],
    ['EMPLOYEE', '/meus-cursos', 'Meus cursos'],
  ] as const)('denies the %s profile and redirects to %s', async (role, destination, heading) => {
    restoreSession({ ...company, role });
    render(<AppRouter />);
    await waitFor(() => expect(window.location.pathname).toBe(destination));
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Dashboard de Engajamento' }),
    ).not.toBeInTheDocument();
  });
});
