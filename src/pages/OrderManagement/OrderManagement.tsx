import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CircleX, Eye, RotateCcw, UserRound } from 'lucide-react';

import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { formatCurrency } from '@utils/formatters';
import { mapAdminOrderDetailsToOrderRow, toOrderCode } from '@utils/mapAdminOrder';
import {
  Badge,
  Button,
  ConfirmDialog,
  EMPTY_FILTERS,
  Modal,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  OrderDetailModal,
  OrderCancellationAndRefund,
  OrderFilters,
  PageHeader,
  PAYMENT_ICONS,
  PAYMENT_METHOD_LABELS,
  STATUS_VARIANTS,
  SearchBar,
  SumCard,
  Table,
  Toast,
} from '@components/ui';
import type { OrderFiltersValue, OrderRow, TableColumn } from '@components/ui';
import { useAdminCourses } from '@hooks/useAdminCourses';
import { useAdminOrderDetails } from '@hooks/useAdminOrderDetails';
import { useAdminOrderStats } from '@hooks/useAdminOrderStats';
import { useAdminOrders } from '@hooks/useAdminOrders';
import { useToast } from '@hooks/useToast';
import { AdminOrderServiceError, adminOrderService } from '@services/adminOrderService';
import type { OrderManagementAction } from '@services/orderCancellationMockService';
import type { AdminOrderFilters, AdminOrderSummary } from '@/types/order';
import styles from './OrderManagement.module.css';

const ORDER_ACTION_CONFIRMATION = {
  cancel: {
    title: 'Confirmar cancelamento',
    description:
      'O cancelamento revoga o acesso ao curso. O progresso concluído pelo aluno será preservado.',
    confirmLabel: 'Confirmar cancelamento',
  },
  refund: {
    title: 'Confirmar reembolso',
    description:
      'O registro do reembolso não altera o progresso do aluno. O acesso continuará revogado.',
    confirmLabel: 'Confirmar reembolso',
  },
} as const;

type PendingTableAction = {
  orderId: string;
  action: OrderManagementAction;
};

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

const ACTION_ICON_SIZE = 16;

const formatShortDate = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const toAdminOrderFilters = (filters: OrderFiltersValue, search: string): AdminOrderFilters => ({
  ...(filters.type ? { type: filters.type } : {}),
  ...(filters.courseId ? { courseId: filters.courseId } : {}),
  ...(filters.startDate ? { from: filters.startDate } : {}),
  ...(filters.endDate ? { to: filters.endDate } : {}),
  ...(filters.status ? { status: filters.status } : {}),
  ...(search ? { search } : {}),
});

const menuItems = SIDEBAR_MENU_PRESETS.admin.map((item) => ({
  ...item,
  active: item.route === '/admin/pedidos',
}));

export const Ordermanagement = () => {
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OrderFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [displayedOrder, setDisplayedOrder] = useState<OrderRow | null>(null);
  const [pendingTableAction, setPendingTableAction] = useState<PendingTableAction | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const adminFilters = useMemo(
    () => toAdminOrderFilters(filters, searchTerm),
    [filters, searchTerm],
  );

  const { orders, status, errorMessage, totalPages, totalElements, reload } = useAdminOrders(
    adminFilters,
    page,
  );
  const { stats, status: statsStatus, reload: reloadStats } = useAdminOrderStats(adminFilters);

  const { courses: adminCourses } = useAdminCourses();
  const filterCourses = useMemo(
    () => adminCourses.map((course) => ({ id: course.id, name: course.title })),
    [adminCourses],
  );

  const {
    order: orderDetails,
    status: detailStatus,
    errorMessage: detailErrorMessage,
  } = useAdminOrderDetails(selectedOrderId);

  const selectedOrderRow = useMemo(
    () => (orderDetails ? mapAdminOrderDetailsToOrderRow(orderDetails) : null),
    [orderDetails],
  );

  useEffect(() => {
    setDisplayedOrder(selectedOrderRow);
  }, [selectedOrderRow]);

  const handleFiltersChange = (next: OrderFiltersValue) => {
    setFilters(next);
    setPage(0);
  };

  const handleSearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed === searchTerm) return;
    setSearchTerm(trimmed);
    setPage(0);
  };

  const statsReady = statsStatus === 'success' && stats !== null;

  const handleReload = () => {
    reload();
    reloadStats();
  };

  const closeDetails = () => setSelectedOrderId(null);

  const applyActionResultToDisplayedOrder = (
    orderId: string,
    action: OrderManagementAction,
    statusHistory: Array<{ status: OrderRow['status']; reason: string | null; createdAt: string }>,
  ) => {
    setDisplayedOrder((current) => {
      if (!current || current.id !== orderId) return current;
      const nextStatus = action === 'cancel' ? 'CANCELLED' : 'REFUNDED';
      return {
        ...current,
        status: nextStatus,
        statusHistory: statusHistory.map((change) => ({
          status: change.status,
          date: change.createdAt,
          description:
            change.reason ??
            (change.status === 'CANCELLED'
              ? 'Pedido cancelado pelo administrador.'
              : change.status === 'REFUNDED'
                ? 'Reembolso registrado pelo administrador.'
                : 'Pagamento aprovado.'),
        })),
      };
    });
  };

  const executeOrderAction = async (
    orderId: string,
    action: OrderManagementAction,
  ): Promise<void> => {
    setPendingAction(true);
    try {
      const result =
        action === 'cancel'
          ? await adminOrderService.cancel(orderId)
          : await adminOrderService.refund(orderId);

      applyActionResultToDisplayedOrder(orderId, action, result.statusHistory);

      if (action === 'cancel') {
        showToast(
          'success',
          'Pedido cancelado',
          'Acesso revogado. O progresso do aluno foi preservado.',
        );
      } else {
        showToast(
          'success',
          'Reembolso registrado',
          'O acesso continua revogado e o progresso foi preservado.',
        );
      }
      handleReload();
    } catch (error) {
      if (!(error instanceof AdminOrderServiceError)) throw error;
      showToast(
        'error',
        error.status === 404 ? 'Pedido não encontrado' : 'Não foi possível concluir a ação',
        error.message,
      );
    } finally {
      setPendingAction(false);
    }
  };

  const handleOrderAction = async (action: OrderManagementAction): Promise<void> => {
    if (!displayedOrder) return;
    await executeOrderAction(displayedOrder.id, action);
  };

  const confirmTableAction = async () => {
    if (!pendingTableAction) return;
    await executeOrderAction(pendingTableAction.orderId, pendingTableAction.action);
    setPendingTableAction(null);
  };

  const columns: TableColumn<AdminOrderSummary>[] = [
    {
      id: 'code',
      header: 'ID pedido',
      align: 'start',
      render: (order) => <span className={styles.code}>{toOrderCode(order.id)}</span>,
    },
    {
      id: 'requester',
      header: 'Solicitante',
      align: 'start',
      render: (order) => <div className={styles.clientCell}>{order.requester}</div>,
    },
    {
      id: 'type',
      header: 'Tipo',
      render: (order) => {
        const isCorporate = order.type === 'CORPORATE';
        const TypeIcon = isCorporate ? Building2 : UserRound;

        return (
          <span
            className={`${styles.typeBadge} ${isCorporate ? styles.corporateBadge : styles.individualBadge}`}
          >
            <TypeIcon size={ACTION_ICON_SIZE} aria-hidden="true" />
            {ORDER_TYPE_LABELS[order.type]}
          </span>
        );
      },
    },
    {
      id: 'course',
      header: 'Curso / Assentos',
      align: 'center',
      render: (order) =>
        order.courseTitle === null
          ? `${order.seatsQuantity ?? 0} ${order.seatsQuantity === 1 ? 'assento' : 'assentos'}`
          : order.courseTitle,
    },
    {
      id: 'purchaseDate',
      header: 'Data',
      render: (order) => formatShortDate(order.purchaseDate),
    },
    {
      id: 'paymentMethod',
      header: 'Pagamento',
      render: (order) => {
        const PaymentIcon = PAYMENT_ICONS[order.paymentMethod];

        return (
          <span className={styles.paymentMethod}>
            <PaymentIcon size={ACTION_ICON_SIZE} aria-hidden="true" />
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </span>
        );
      },
    },
    {
      id: 'amount',
      header: 'Valor',
      render: (order) => formatCurrency(order.amount),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      render: (order) => (
        <Badge
          label={ORDER_STATUS_LABELS[order.status]}
          variant={STATUS_VARIANTS[order.status]}
          mini
          className={styles.statusBadge}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      render: (order) => {
        const orderCode = toOrderCode(order.id);
        const canCancel = order.status === 'APPROVED';
        const canRefund = order.status === 'CANCELLED';

        return (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Ver pedido ${orderCode}`}
              onClick={() => setSelectedOrderId(order.id)}
            >
              <Eye size={ACTION_ICON_SIZE} aria-hidden="true" />
            </button>
            {canRefund ? (
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Reembolsar pedido ${orderCode}`}
                title="Reembolsar pedido"
                disabled={pendingAction}
                onClick={() => setPendingTableAction({ orderId: order.id, action: 'refund' })}
              >
                <RotateCcw size={ACTION_ICON_SIZE} aria-hidden="true" />
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                className={`${styles.iconButton} ${styles.dangerButton}`}
                aria-label={`Cancelar pedido ${orderCode}`}
                title="Cancelar pedido"
                disabled={pendingAction}
                onClick={() => setPendingTableAction({ orderId: order.id, action: 'cancel' })}
              >
                <CircleX size={ACTION_ICON_SIZE} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER}>
      <PageHeader
        eyebrow="Painel administrativo • Pedidos"
        title="Gestão de Pedidos"
        subtitle="Consulte e gerencie as compras realizadas na plataforma."
      />

      <section className={styles.stats} aria-label="Resumo dos pedidos">
        <SumCard
          label="Receita aprovada"
          value={statsReady ? formatCurrency(stats.approvedRevenue) : '—'}
          description={`${statsReady ? stats.approvedCount : '—'} pedidos ativos`}
        />

        <SumCard
          label="Pedidos Realizados"
          value={statsReady ? stats.approvedCount + stats.cancelledOrRefundedCount : '—'}
          description="Total de pedidos feitos"
        />

        <SumCard
          label="Pedidos Aprovados"
          value={statsReady ? stats.approvedCount : '—'}
          description="Acesso liberado automaticamente"
        />

        <SumCard
          label="Cancelados / reembolsados"
          value={statsReady ? stats.cancelledOrRefundedCount : '—'}
          description="Acesso revogado"
        />
      </section>

      <section className={styles.catalog} aria-label="Pedidos">
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <OrderFilters
              value={filters}
              onChange={handleFiltersChange}
              courses={filterCourses}
              showClearButton={false}
              className={styles.inlineFilters}
            />
            <div className={styles.search}>
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                size="sm"
                placeholder="Buscar pedido"
                aria-label="Buscar pedido"
              />
            </div>
          </div>
        </div>

        {status === 'error' ? (
          <div className={styles.errorState} role="alert">
            <h3 className={styles.errorTitle}>Não foi possível carregar os pedidos</h3>
            <p className={styles.errorDescription}>
              {errorMessage ?? 'Verifique sua conexão e tente novamente em instantes.'}
            </p>
            <Button variant="primary" label="Tentar novamente" onClick={handleReload} />
          </div>
        ) : status === 'loading' ? (
          <p className={styles.loading} role="status">
            Carregando pedidos…
          </p>
        ) : (
          <Table
            columns={columns}
            data={orders}
            getRowId={(order) => order.id}
            caption="Pedidos da plataforma"
            emptyMessage="Nenhum pedido encontrado para os filtros selecionados."
            footer={
              <div className={styles.tableFooter}>
                <p className={styles.footerText}>
                  Mostrando {orders.length} de {totalElements} pedidos
                </p>
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    aria-label="Anterior"
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                    disabled={page === 0}
                  >
                    <ArrowLeft size={ACTION_ICON_SIZE} aria-hidden="true" />
                  </button>
                  <span className={styles.pageIndicator}>
                    Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    aria-label="Próxima"
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
                    disabled={page + 1 >= totalPages}
                  >
                    <ArrowRight size={ACTION_ICON_SIZE} aria-hidden="true" />
                  </button>
                </div>
              </div>
            }
          />
        )}
      </section>

      {selectedOrderId ? (
        detailStatus === 'loading' ? (
          <Modal
            open
            onOpenChange={(open) => {
              if (!open) closeDetails();
            }}
            title="Detalhe do pedido"
            size="sm"
          >
            <p role="status">Carregando pedido…</p>
          </Modal>
        ) : detailStatus === 'error' ? (
          <Modal
            open
            onOpenChange={(open) => {
              if (!open) closeDetails();
            }}
            title="Detalhe do pedido"
            size="sm"
          >
            <p role="alert">{detailErrorMessage ?? 'Pedido não encontrado.'}</p>
          </Modal>
        ) : displayedOrder ? (
          <OrderDetailModal
            order={displayedOrder}
            open
            actions={
              <OrderCancellationAndRefund
                order={displayedOrder}
                isSubmitting={pendingAction}
                onAction={handleOrderAction}
              />
            }
            onOpenChange={(open) => {
              if (!open) closeDetails();
            }}
          />
        ) : null
      ) : null}
      {pendingTableAction ? (
        <ConfirmDialog
          open
          title={ORDER_ACTION_CONFIRMATION[pendingTableAction.action].title}
          description={ORDER_ACTION_CONFIRMATION[pendingTableAction.action].description}
          confirmLabel={ORDER_ACTION_CONFIRMATION[pendingTableAction.action].confirmLabel}
          isConfirming={pendingAction}
          onConfirm={confirmTableAction}
          onOpenChange={(open) => {
            if (!open && !pendingAction) setPendingTableAction(null);
          }}
        />
      ) : null}
      {toast ? (
        <Toast
          open={isOpen}
          onOpenChange={dismissToast}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}
    </AuthenticatedLayout>
  );
};
