import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { adminMetricsService, AdminMetricsServiceError } from '@services/adminMetricsService';
import type * as AdminMetricsServiceModule from '@services/adminMetricsService';
import type { AdminMetricsOverview } from '@/types/adminMetrics';
import { adminMetricsOverview, zeroAdminMetricsOverview } from '@/test/adminMetricsFixtures';
import { AdminMetrics } from './AdminMetrics';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof Recharts>()),
  ResponsiveContainer: (await import('@/test/FixedChartContainer')).FixedChartContainer,
}));
vi.mock('@services/adminMetricsService', async (importOriginal) => ({
  ...(await importOriginal<typeof AdminMetricsServiceModule>()),
  adminMetricsService: { getOverview: vi.fn() },
}));

const getOverviewMock = vi.mocked(adminMetricsService.getOverview);
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/metricas']}>
      <AdminMetrics />
    </MemoryRouter>,
  );

describe('AdminMetrics — integração da US-36', () => {
  beforeEach(() => {
    getOverviewMock.mockReset().mockResolvedValue(adminMetricsOverview);
  });

  it('preserves the authenticated shell and all four metric areas', async () => {
    renderPage();
    await screen.findByText('68%');
    const main = within(screen.getByRole('main'));
    expect(
      main.getByRole('heading', { level: 1, name: 'Relatórios Gerais & Métricas' }),
    ).toBeInTheDocument();
    expect(main.getAllByRole('article')).toHaveLength(2);
    expect(main.getAllByRole('region')).toHaveLength(2);
    expect(main.getByRole('article', { name: 'Alunos ativos' })).toBeInTheDocument();
    expect(main.getByRole('article', { name: 'Empresas parceiras' })).toBeInTheDocument();
    for (const title of ['Taxa Média de Conclusão', 'Evolução de Alunos Ativos']) {
      expect(
        within(main.getByRole('region', { name: title })).getByRole('heading', {
          level: 2,
          name: title,
        }),
      ).toBeInTheDocument();
    }
    expect(main.getByRole('region', { name: 'Evolução de Alunos Ativos' })).toHaveAttribute(
      'id',
      'evolucao',
    );
    expect(main.getByText('Últimos seis meses')).toBeInTheDocument();
  });

  it('keeps metrics selected in the administrative navigation', async () => {
    renderPage();
    await screen.findByText('68%');
    const navigation = within(
      screen.getByRole('navigation', { name: 'Navegação do perfil Admin' }),
    );
    expect(navigation.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'href',
      '/admin/metricas',
    );
    expect(navigation.getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(navigation.getByRole('link', { name: 'Gestão de Cursos' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('shows four independently labelled skeletons while the overview is pending', () => {
    getOverviewMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    const main = within(screen.getByRole('main'));
    for (const name of [
      'Carregando alunos ativos',
      'Carregando empresas parceiras',
      'Carregando taxa média de conclusão',
      'Carregando evolução de alunos ativos',
    ]) {
      expect(main.getByRole('status', { name })).toHaveAttribute('aria-busy', 'true');
    }
    expect(main.getAllByRole('status')).toHaveLength(4);
    expect(main.queryByRole('img')).not.toBeInTheDocument();
    expect(main.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(getOverviewMock).toHaveBeenCalledOnce();
  });

  it('shows real Brazilian counts and an accessible progress donut using the actual rate', async () => {
    renderPage();
    await screen.findByText('68%');
    expect(
      within(screen.getByRole('article', { name: 'Alunos ativos' })).getByText('12.847'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Empresas parceiras' })).getByText('1.532'),
    ).toBeInTheDocument();
    const completion = within(screen.getByRole('region', { name: 'Taxa Média de Conclusão' }));
    expect(
      completion.getByRole('img', { name: /Taxa média de conclusão.*68 de 100, 68%/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Dados ainda não disponíveis.')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a fractional rate with a Brazilian decimal separator', async () => {
    getOverviewMock.mockResolvedValue({ ...adminMetricsOverview, averageCompletionRate: 66.67 });
    renderPage();
    expect(await screen.findByText('66,67%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /66,67 de 100, 66,67%/ })).toBeInTheDocument();
  });

  it('draws six monthly points including zero and keeps every formatted value accessible', async () => {
    renderPage();
    const chart = await screen.findByRole('img', {
      name: 'Evolução de Alunos Ativos. jun. 26: 9.500. jul. 26: 0. ago. 26: 11.230. set. 26: 12.001. out. 26: 12.700. nov. 26: 13.001.',
    });
    expect(chart.querySelectorAll('.recharts-line-dot')).toHaveLength(6);
    expect(
      within(screen.getByRole('article', { name: 'Alunos ativos' })).getByText('12.847'),
    ).toBeInTheDocument();
  });

  it('renders a zero overview as successful metrics and six zero points', async () => {
    getOverviewMock.mockResolvedValue(zeroAdminMetricsOverview);
    renderPage();
    expect(await screen.findByText('0%')).toBeInTheDocument();
    for (const label of ['Alunos ativos', 'Empresas parceiras']) {
      expect(
        within(screen.getByRole('article', { name: label })).getByText('0'),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole('img', { name: /Taxa média de conclusão.*0 de 100, 0%/ }),
    ).toBeInTheDocument();
    const chart = screen.getByRole('img', {
      name: 'Evolução de Alunos Ativos. jun. 26: 0. jul. 26: 0. ago. 26: 0. set. 26: 0. out. 26: 0. nov. 26: 0.',
    });
    expect(chart.querySelectorAll('.recharts-line-dot')).toHaveLength(6);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum dado disponível.')).not.toBeInTheDocument();
  });

  it.each([
    [new AdminMetricsServiceError(0, 'Verifique sua conexão.'), 'Verifique sua conexão.'],
    [
      new AdminMetricsServiceError(500, 'Internal error'),
      'Não foi possível carregar os indicadores. Tente novamente.',
    ],
  ])(
    'shows an error and retry action for %s without inventing zero values',
    async (error, message) => {
      getOverviewMock.mockRejectedValue(error);
      renderPage();
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getAllByRole('button', { name: 'Tentar novamente' })).toHaveLength(1);
      for (const label of ['Alunos ativos', 'Empresas parceiras']) {
        expect(
          within(screen.getByRole('article', { name: label })).getByText('—'),
        ).toBeInTheDocument();
      }
      const main = within(screen.getByRole('main'));
      expect(main.queryByRole('img')).not.toBeInTheDocument();
      expect(main.queryByRole('status')).not.toBeInTheDocument();
      expect(main.getAllByRole('region')).toHaveLength(2);
    },
  );

  it('retries after a failure, shows skeletons and recovers without reloading the page', async () => {
    const user = userEvent.setup();
    let resolveRetry!: (data: AdminMetricsOverview) => void;
    const retry = new Promise<AdminMetricsOverview>((resolve) => {
      resolveRetry = resolve;
    });
    getOverviewMock
      .mockRejectedValueOnce(new AdminMetricsServiceError(0, 'Verifique sua conexão.'))
      .mockReturnValueOnce(retry);
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('status')).toHaveLength(4);
    expect(getOverviewMock).toHaveBeenCalledTimes(2);
    resolveRetry(adminMetricsOverview);
    expect(await screen.findByText('68%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
