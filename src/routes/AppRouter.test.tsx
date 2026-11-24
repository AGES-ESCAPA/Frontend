import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { authService } from '@services/authService';
import { adminMetricsService } from '@services/adminMetricsService';
import { courseService } from '@services/courseService';
import type * as CourseServiceModule from '@services/courseService';
import type * as AdminMetricsServiceModule from '@services/adminMetricsService';
import type { UseNotificationsResult } from '@hooks/useNotifications';
import { zeroAdminMetricsOverview } from '@/test/adminMetricsFixtures';
import type { AuthUser } from '@/types/auth';
import { AppRouter } from './AppRouter';
import type * as Recharts from 'recharts';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));
vi.mock('@services/adminMetricsService', async (importOriginal) => ({
  ...(await importOriginal<typeof AdminMetricsServiceModule>()),
  adminMetricsService: { getOverview: vi.fn(), getCourseMetrics: vi.fn() },
}));
vi.mock('@hooks/useNotifications', () => ({
  useNotifications: (): UseNotificationsResult => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
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
vi.mock('@pages/Courses/Courses', () => ({ Courses: () => <h1>Cursos</h1> }));
vi.mock('@pages/CompanyEmployees/CompanyEmployees', () => ({
  CompanyEmployees: () => <h1>Gestão de Colaboradores</h1>,
}));
vi.mock('@pages/AdminCourses/AdminCourses', () => ({
  AdminCourses: () => <h1>Gestão de Cursos</h1>,
}));
vi.mock('@pages/UnderConstruction/UnderConstruction', () => ({
  UnderConstruction: () => <h1>Página em construção</h1>,
}));
vi.mock('@services/courseService', async (importOriginal) => ({
  ...(await importOriginal<typeof CourseServiceModule>()),
  courseService: {
    getCourses: vi.fn(),
    getCourseFilters: vi.fn(),
  },
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
    vi.mocked(adminMetricsService.getOverview)
      .mockReset()
      .mockResolvedValue(zeroAdminMetricsOverview);
    vi.mocked(adminMetricsService.getCourseMetrics).mockReset().mockResolvedValue({
      mostAccessedCourse: null,
      topCourses: [],
      categoriesCount: 0,
      enrollmentsByCategory: [],
    });
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
    const completionRegion = screen.getByRole('region', { name: 'Taxa Média de Conclusão' });
    expect(await within(completionRegion).findByText('0%')).toBeInTheDocument();
    expect(adminMetricsService.getOverview).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('redirects anonymous visitors to login and preserves the requested URL', async () => {
    window.history.replaceState(null, '', '/admin/metricas?periodo=6#evolucao');
    render(<AppRouter />);
    expect(
      await screen.findByText('Login: /admin/metricas?periodo=6#evolucao'),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(adminMetricsService.getOverview).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['STUDENT', '/aluno/cursos', 'Cursos'],
    ['EMPLOYEE', '/meus-cursos', 'Meus cursos'],
    ['COMPANY', '/empresa/cursos', 'Cursos'],
  ] as const)('denies the %s profile and redirects to %s', async (role, destination, heading) => {
    restoreSession({ ...admin, role });
    render(<AppRouter />);
    await waitFor(() => expect(window.location.pathname).toBe(destination));
    expect(adminMetricsService.getOverview).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Relatórios Gerais & Métricas' }),
    ).not.toBeInTheDocument();
  });

  it('waits for session restoration before showing metrics or redirecting', () => {
    localStorage.setItem('access_token', 'test-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(new Promise<AuthUser>(() => {}));
    render(<AppRouter />);
    expect(screen.getByRole('status', { name: 'Restaurando sessão' })).toBeInTheDocument();
    expect(adminMetricsService.getOverview).not.toHaveBeenCalled();
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
    ['STUDENT', '/aluno/cursos', 'Cursos'],
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

describe('AppRouter — rotas públicas de conta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it.each([
    ['/esqueci-minha-senha', 'Esqueci minha senha'],
    ['/redefinir-senha', 'Redefinir senha'],
    ['/confirmar-email', 'Confirmar novo e-mail'],
  ] as const)('renders %s without requiring authentication', async (path, heading) => {
    window.history.replaceState(null, '', path);
    render(<AppRouter />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(window.location.pathname).toBe(path);
  });
});

describe('AppRouter — rotas públicas e 404', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(courseService.getCourses).mockReset().mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 0,
      totalPages: 0,
    });
    vi.mocked(courseService.getCourseFilters).mockReset().mockResolvedValue({
      categories: [],
      levels: [],
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('renders the home catalog for anonymous visitors', async () => {
    window.history.replaceState(null, '', '/');
    render(<AppRouter />);

    expect(
      await screen.findByRole('navigation', { name: /navegação principal/i }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(courseService.getCourses).toHaveBeenCalled();
  });

  it('renders the not-found page for unknown URLs', async () => {
    window.history.replaceState(null, '', '/url-que-nao-existe');
    render(<AppRouter />);

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/url-que-nao-existe');
  });
});

describe('AppRouter — rotas protegidas', () => {
  const student: AuthUser = { ...admin, id: 'student-1', role: 'STUDENT' };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('renders /admin/cursos for an administrator', async () => {
    window.history.replaceState(null, '', '/admin/cursos');
    restoreSession(admin);
    render(<AppRouter />);

    expect(await screen.findByRole('heading', { name: 'Gestão de Cursos' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/cursos');
  });

  it('redirects students away from /admin/cursos', async () => {
    window.history.replaceState(null, '', '/admin/cursos');
    restoreSession(student);
    render(<AppRouter />);

    await waitFor(() => expect(window.location.pathname).toBe('/aluno/cursos'));
    expect(await screen.findByRole('heading', { name: 'Cursos' })).toBeInTheDocument();
  });

  it('redirects company employees away from the public student catalog', async () => {
    window.history.replaceState(null, '', '/aluno/cursos');
    restoreSession({ ...student, id: 'employee-1', role: 'EMPLOYEE' });
    render(<AppRouter />);

    await waitFor(() => expect(window.location.pathname).toBe('/meus-cursos'));
    expect(await screen.findByRole('heading', { name: 'Meus cursos' })).toBeInTheDocument();
  });

  it('sends anonymous visitors on /meus-cursos to login', async () => {
    window.history.replaceState(null, '', '/meus-cursos');
    render(<AppRouter />);

    expect(await screen.findByText('Login: /meus-cursos')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('shows under construction for authenticated students on unknown /aluno routes', async () => {
    window.history.replaceState(null, '', '/aluno/certificados');
    restoreSession(student);
    render(<AppRouter />);

    expect(
      await screen.findByRole('heading', { name: 'Página em construção' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/aluno/certificados');
  });
});
