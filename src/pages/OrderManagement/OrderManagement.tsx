import { useEffect, useMemo, useState } from 'react';
import { Building2, CircleX, Eye, RotateCcw, UserRound } from 'lucide-react';

import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { formatCurrency, formatLongDate } from '@utils/formatters';
import { mapAdminOrderDetailsToOrderRow, toOrderCode } from '@utils/mapAdminOrder';
import {
  Badge,
  Button,
  EMPTY_FILTERS,
  Modal,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  OrderDetailModal,
  OrderCancellationAndRefund,
  OrderFilters,
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
import { useAdminOrders } from '@hooks/useAdminOrders';
import { useToast } from '@hooks/useToast';
import {
  createOrderCancellationMockService,
  OrderActionError,
} from '@services/orderCancellationMockService';
import type { OrderManagementAction } from '@services/orderCancellationMockService';
import type { AdminOrderFilters, AdminOrderSummary } from '@/types/order';
import styles from './OrderManagement.module.css';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

const toAdminOrderFilters = (filters: OrderFiltersValue): AdminOrderFilters => ({
  ...(filters.type ? { type: filters.type } : {}),
  ...(filters.courseId ? { courseId: filters.courseId } : {}),
  ...(filters.startDate ? { from: filters.startDate } : {}),
  ...(filters.endDate ? { to: filters.endDate } : {}),
  ...(filters.status ? { status: filters.status } : {}),
});

const matchesSearch = (order: AdminOrderSummary, term: string): boolean => {
  const value = term.trim().toLocaleLowerCase('pt-BR');
  if (!value) return true;

  return [toOrderCode(order.id), order.requester, order.courseTitle ?? ''].some((field) =>
    field.toLocaleLowerCase('pt-BR').includes(value),
  );
};

const menuItems = SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({
  ...item,
  active: index === 0,
}));

export const Ordermanagement = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OrderFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [displayedOrder, setDisplayedOrder] = useState<OrderRow | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const adminFilters = useMemo(() => toAdminOrderFilters(filters), [filters]);

  const { orders, status, errorMessage, totalPages, totalElements, reload } = useAdminOrders(
    adminFilters,
    page,
  );

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

  const orderActionService = useMemo(
    () => (selectedOrderRow ? createOrderCancellationMockService([selectedOrderRow]) : null),
    [selectedOrderRow],
  );

  useEffect(() => {
    setDisplayedOrder(selectedOrderRow);
  }, [selectedOrderRow]);

  const handleFiltersChange = (next: OrderFiltersValue) => {
    setFilters(next);
    setPage(0);
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesSearch(order, search)),
    [orders, search],
  );

  const approvedOrders = orders.filter((order) => order.status === 'APPROVED');
  const approvedRevenue = approvedOrders.reduce((sum, order) => sum + order.amount, 0);
  const canceledOrRefundedCount = orders.length - approvedOrders.length;
  const closeDetails = () => setSelectedOrderId(null);

  const handleOrderAction = async (action: OrderManagementAction): Promise<void> => {
    if (!displayedOrder || !orderActionService) return;

    setPendingAction(true);
    try {
      const result = orderActionService.executeAction(
        displayedOrder.id,
        action,
        displayedOrder.status,
      );
      setDisplayedOrder(result.order);
      if (action === 'cancel') {
        showToast(
          'success',
          'Pedido cancelado',
          `Acesso revogado. Progresso do aluno preservado em ${result.enrollmentAccess.progressPercent}%.`,
        );
      } else {
        showToast(
          'success',
          'Reembolso registrado',
          'O acesso continua revogado e o progresso foi preservado.',
        );
      }
    } catch (error) {
      if (!(error instanceof OrderActionError)) throw error;
      showToast(
        'error',
        error.status === 409 ? 'Não foi possível concluir a ação' : 'Pedido não encontrado',
        error.message,
      );
    } finally {
      setPendingAction(false);
    }
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
            <TypeIcon size={24} aria-hidden="true" />
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
      header: 'Data da compra',
      render: (order) => formatLongDate(order.purchaseDate.slice(0, 10)),
    },
    {
      id: 'paymentMethod',
      header: 'Forma de pagamento',
      render: (order) => {
        const PaymentIcon = PAYMENT_ICONS[order.paymentMethod];

        return (
          <span className={styles.paymentMethod}>
            <PaymentIcon size={24} aria-hidden="true" />
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </span>
        );
      },
    },
    {
      id: 'amount',
      header: 'Valor',
      align: 'end',
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
      render: (order) => (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Ver pedido ${toOrderCode(order.id)}`}
            onClick={() => setSelectedOrderId(order.id)}
          >
            <Eye size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Reembolsar pedido ${toOrderCode(order.id)}`}
            title="Disponível nos detalhes do pedido"
            disabled
          >
            <RotateCcw size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Cancelar pedido ${toOrderCode(order.id)}`}
            title="Disponível nos detalhes do pedido"
            disabled
          >
            <CircleX size={24} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER}>
      <section className={styles.catalog}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.eyebrow}>Administração</p>
            <h1 className={styles.heading}>Gestão de Pedidos</h1>
            <p className={styles.description}>
              Consulte e gerencie as compras realizadas na plataforma.
            </p>
          </div>
          <div className={styles.search}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar pedido nesta página"
              aria-label="Buscar pedido nesta página"
            />
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Resumo dos pedidos nesta página">
        <SumCard
          label="Receita aprovada"
          value={status === 'loading' ? '—' : formatCurrency(approvedRevenue)}
          description={`${approvedOrders.length} pedidos ativos nesta página`}
        />

        <SumCard
          label="Pedidos Aprovados"
          value={status === 'loading' ? '—' : approvedOrders.length}
          description="Acesso liberado automaticamente"
        />

        <SumCard
          label="Cancelados e reembolsados"
          value={status === 'loading' ? '—' : canceledOrRefundedCount}
          description="Acesso revogado"
        />
      </section>

      <section className={styles.ordersPanel} aria-label="Listagem de pedidos">
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <h2>Pedidos</h2>
            <span aria-label={`${totalElements} pedidos`}>{totalElements}</span>
          </div>
          <div className={styles.panelControls}>
            <OrderFilters
              value={filters}
              onChange={handleFiltersChange}
              courses={filterCourses}
              className={styles.inlineFilters}
            />
          </div>
        </header>

        {status === 'error' ? (
          <div className={styles.errorState} role="alert">
            <h3 className={styles.errorTitle}>Não foi possível carregar os pedidos</h3>
            <p className={styles.errorDescription}>
              {errorMessage ?? 'Verifique sua conexão e tente novamente em instantes.'}
            </p>
            <Button variant="primary" label="Tentar novamente" onClick={reload} />
          </div>
        ) : status === 'loading' ? (
          <p className={styles.loading} role="status">
            Carregando pedidos…
          </p>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredOrders}
              getRowId={(order) => order.id}
              caption="Pedidos da plataforma"
              emptyMessage="Nenhum pedido encontrado para os filtros selecionados."
              className={styles.ordersTable}
              footer={
                <div className={styles.tableFooter}>
                  <p>
                    Mostrando {filteredOrders.length} de {orders.length} pedidos nesta página
                  </p>
                  <p className={styles.panelNote}>Liberação de acesso automática via checkout</p>
                </div>
              }
            />

            <div className={styles.pagination}>
              <Button
                variant="outlined"
                label="Anterior"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={page === 0}
              />
              <span className={styles.pageIndicator}>
                Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
              </span>
              <Button
                variant="outlined"
                label="Próxima"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
                disabled={page + 1 >= totalPages}
              />
            </div>
          </>
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
