import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminCourses } from '@hooks/useAdminCourses';
import { useAdminOrderDetails } from '@hooks/useAdminOrderDetails';
import { useAdminOrderStats } from '@hooks/useAdminOrderStats';
import { useAdminOrders } from '@hooks/useAdminOrders';
import type { UseAdminOrdersResult } from '@hooks/useAdminOrders';
import type { UseAdminOrderDetailsResult } from '@hooks/useAdminOrderDetails';
import type { UseAdminOrderStatsResult } from '@hooks/useAdminOrderStats';
import type { AdminOrderDetails, AdminOrderSummary } from '@/types/order';
import { Ordermanagement } from './OrderManagement';

vi.mock('@hooks/useAdminOrders', () => ({ useAdminOrders: vi.fn() }));
vi.mock('@hooks/useAdminOrderDetails', () => ({ useAdminOrderDetails: vi.fn() }));
vi.mock('@hooks/useAdminOrderStats', () => ({ useAdminOrderStats: vi.fn() }));
vi.mock('@hooks/useAdminCourses', () => ({ useAdminCourses: vi.fn() }));

const useAdminOrdersMock = vi.mocked(useAdminOrders);
const useAdminOrderDetailsMock = vi.mocked(useAdminOrderDetails);
const useAdminOrderStatsMock = vi.mocked(useAdminOrderStats);
const useAdminCoursesMock = vi.mocked(useAdminCourses);

const order: AdminOrderSummary = {
  id: 'order-1',
  requester: 'Ana Paula Ferreira',
  type: 'INDIVIDUAL',
  courseTitle: 'Escape Room Design Avançado',
  seatsQuantity: null,
  purchaseDate: '2026-08-17T12:00:00',
  paymentMethod: 'PIX',
  amount: 297,
  status: 'APPROVED',
};

const details: AdminOrderDetails = {
  id: 'order-1',
  type: 'INDIVIDUAL',
  buyer: {
    id: 'buyer-1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    document: '12345678900',
    phone: '11999999999',
  },
  item: {
    type: 'COURSE',
    courseId: 'course-1',
    courseTitle: 'Escape Room Design Avançado',
    seatsQuantity: null,
  },
  amount: 297,
  paymentMethod: 'PIX',
  installments: null,
  status: 'APPROVED',
  createdAt: '2026-08-17T12:00:00',
  statusHistory: [
    {
      id: 'h1',
      status: 'APPROVED',
      changedBy: null,
      reason: null,
      createdAt: '2026-08-17T12:00:00',
    },
  ],
  collaboratorsWithAccessCount: null,
};

const defaultOrdersResult: UseAdminOrdersResult = {
  orders: [order],
  status: 'success',
  errorMessage: null,
  totalPages: 3,
  totalElements: 21,
  reload: vi.fn(),
};

const defaultStatsResult: UseAdminOrderStatsResult = {
  stats: { approvedCount: 18, approvedRevenue: 5346, cancelledOrRefundedCount: 3 },
  status: 'success',
  reload: vi.fn(),
};

const defaultDetailsResult: UseAdminOrderDetailsResult = {
  order: null,
  status: 'loading',
  errorMessage: null,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <Ordermanagement />
    </MemoryRouter>,
  );

describe('OrderManagement', () => {
  beforeEach(() => {
    useAdminOrdersMock.mockReturnValue({ ...defaultOrdersResult });
    useAdminOrderDetailsMock.mockReturnValue({ ...defaultDetailsResult });
    useAdminOrderStatsMock.mockReturnValue({ ...defaultStatsResult });
    useAdminCoursesMock.mockReturnValue({
      courses: [],
      status: 'success',
      errorMessage: null,
      reload: vi.fn(),
      archiveCourse: vi.fn(),
    });
  });

  it('renders the orders returned by useAdminOrders', () => {
    renderPage();

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();
    expect(screen.getByText('Escape Room Design Avançado')).toBeInTheDocument();
  });

  it('marks Pedidos as the menu link for this page', () => {
    renderPage();

    const pedidos = screen.getByRole('link', { name: 'Pedidos' });
    expect(pedidos).toHaveAttribute('href', '/admin/pedidos');
    expect(pedidos).toHaveAttribute('aria-current', 'page');
  });

  it('shows the totals from useAdminOrderStats instead of summing the current page', () => {
    renderPage();

    const summary = within(screen.getByRole('region', { name: 'Resumo dos pedidos' }));
    expect(summary.getByText(/5\.346,00/)).toBeInTheDocument();
    expect(summary.getByText('18 pedidos ativos')).toBeInTheDocument();
    expect(summary.getByText('Pedidos Realizados')).toBeInTheDocument();
    expect(summary.getByText('21')).toBeInTheDocument();
    expect(summary.getByText('18')).toBeInTheDocument();
    expect(summary.getByText('3')).toBeInTheDocument();
  });

  it('keeps the totals bound to the filters, not to the page', async () => {
    const user = userEvent.setup();
    renderPage();
    const [initialFilters] = useAdminOrderStatsMock.mock.lastCall ?? [];

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(useAdminOrderStatsMock).toHaveBeenLastCalledWith(initialFilters);
  });

  it('shows placeholders in the totals while they load', () => {
    useAdminOrderStatsMock.mockReturnValue({ stats: null, status: 'loading', reload: vi.fn() });

    renderPage();

    const summary = within(screen.getByRole('region', { name: 'Resumo dos pedidos' }));
    expect(summary.getByText('— pedidos ativos')).toBeInTheDocument();
    expect(summary.queryByText(/5\.346,00/)).not.toBeInTheDocument();
  });

  it('shows a loading indicator while fetching the orders', () => {
    useAdminOrdersMock.mockReturnValue({ ...defaultOrdersResult, status: 'loading', orders: [] });

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando pedidos');
  });

  it('shows the empty-list message when there are no orders', () => {
    useAdminOrdersMock.mockReturnValue({
      ...defaultOrdersResult,
      orders: [],
      totalElements: 0,
      totalPages: 0,
    });

    renderPage();

    expect(
      screen.getByText('Nenhum pedido encontrado para os filtros selecionados.'),
    ).toBeInTheDocument();
  });

  it('shows a network error with a retry action', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    useAdminOrdersMock.mockReturnValue({
      orders: [],
      status: 'error',
      errorMessage: 'Falha ao carregar pedidos.',
      totalPages: 0,
      totalElements: 0,
      reload,
    });

    const reloadStats = vi.fn();
    useAdminOrderStatsMock.mockReturnValue({ ...defaultStatsResult, reload: reloadStats });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar pedidos.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reload).toHaveBeenCalledOnce();
    expect(reloadStats).toHaveBeenCalledOnce();
  });

  it('paginates forward with the Próxima button', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(useAdminOrdersMock).toHaveBeenLastCalledWith(expect.anything(), 1);
  });

  it('resets to the first page when a filter changes', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    useAdminOrdersMock.mockClear();

    await user.selectOptions(screen.getByLabelText('Status'), 'APPROVED');

    expect(useAdminOrdersMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'APPROVED' }),
      0,
    );
  });

  it('sends the search to the API and goes back to the first page', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await user.type(screen.getByRole('textbox', { name: 'Buscar pedido' }), '  vista mar ');

    await waitFor(() =>
      expect(useAdminOrdersMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'vista mar' }),
        0,
      ),
    );
    expect(useAdminOrderStatsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'vista mar' }),
    );
  });

  it('shows every order returned by the API without filtering them locally', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole('textbox', { name: 'Buscar pedido' }),
      'termo sem match local',
    );

    expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 21 pedidos')).toBeInTheDocument();
  });

  it('opens the detail modal with the data from useAdminOrderDetails', async () => {
    const user = userEvent.setup();
    useAdminOrderDetailsMock.mockReturnValue({
      order: details,
      status: 'success',
      errorMessage: null,
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Ver pedido/i }));

    expect(screen.getByText('ana.ferreira@email.com')).toBeInTheDocument();
  });

  it('shows a not-found message in the modal when the order no longer exists', async () => {
    const user = userEvent.setup();
    useAdminOrderDetailsMock.mockReturnValue({
      order: null,
      status: 'error',
      errorMessage: 'Pedido não encontrado.',
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Ver pedido/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Pedido não encontrado.');
  });
});
