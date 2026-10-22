import { useMemo, useState } from 'react';
import { Building2, CircleX, Eye, RotateCcw, UserRound } from 'lucide-react';

import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { formatCurrency, formatLongDate } from '@utils/formatters';
import {
  Badge,
  EMPTY_FILTERS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  OrderDetailModal,
  OrderFilters,
  PAYMENT_ICONS,
  STATUS_VARIANTS,
  SearchBar,
  SumCard,
  Table,
} from '@components/ui';
import type { OrderFiltersValue, OrderRow, TableColumn } from '@components/ui';
import { PAYMENT_METHOD_LABELS } from '@components/ui/OrderDetailModal';
import styles from './Ordermanagement.module.css';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@email.com',
};

const COURSES = [
  { id: 'curso-excel', name: 'Turismo na era da AI' },
  { id: 'curso-design', name: 'Analise de locais de turismo' },
  { id: 'curso-gestao', name: 'Gestão de avaliações dos cursos de turismo' },
  { id: 'curso-lideranca', name: 'Desbravando oportunidades para o turismo' },
  { id: 'curso-marketing', name: 'Marketing para turismo' },
];

// Dados de exemplo. Substituir pela chamada à API quando o backend estiver disponível.
const ORDERS: OrderRow[] = [
  {
    id: '1',
    code: 'PED-00142',
    clientName: 'Ana Paula Ferreira',
    clientEmail: 'ana.ferreira@email.com',
    clientPhone: '(11) 98765-4321',
    clientDocument: '123.456.789-00',
    type: 'INDIVIDUAL',
    courseId: 'curso-design',
    courseName: 'Escape Room Design Avançado',
    seats: 1,
    paymentMethod: 'PIX',
    total: 297,
    createdAt: '2026-08-17T12:00:00.000Z',
    status: 'APPROVED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-17T12:00:00.000Z', description: 'Pagamento aprovado.' },
    ],
  },
  {
    id: '2',
    code: 'PED-00141',
    clientName: 'Marina Oliveira',
    clientEmail: 'marina.oliveira@email.com',
    clientPhone: '(11) 97654-3210',
    clientDocument: '12.345.678/0001-90',
    organizationName: 'Escape Corp Ltda.',
    type: 'CORPORATE',
    corporateKind: 'course',
    courseId: 'curso-excel',
    courseName: 'Excel para Negócios',
    seats: 5,
    paymentMethod: 'CARD',
    installments: 3,
    total: 1185,
    createdAt: '2026-08-16T12:00:00.000Z',
    status: 'APPROVED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-16T12:00:00.000Z', description: 'Pagamento aprovado.' },
    ],
  },
  {
    id: '3',
    code: 'PED-00139',
    clientName: 'Roberto Alves',
    clientEmail: 'roberto.alves@email.com',
    clientPhone: '(21) 99876-5432',
    clientDocument: '987.654.321-00',
    type: 'INDIVIDUAL',
    courseId: 'curso-gestao',
    courseName: 'Gestão de Experiências',
    seats: 1,
    paymentMethod: 'PIX',
    total: 197,
    createdAt: '2026-08-14T12:00:00.000Z',
    status: 'CANCELLED',
    statusHistory: [
      {
        status: 'CANCELLED',
        date: '2026-08-15T12:00:00.000Z',
        description: 'Pedido cancelado pelo administrador.',
      },
    ],
  },
  {
    id: '4',
    code: 'PED-00137',
    clientName: 'Tech Adventures S.A.',
    clientEmail: 'compras@techadventures.com.br',
    clientPhone: '(11) 3456-7890',
    clientDocument: '98.765.432/0001-10',
    organizationName: 'Tech Adventures S.A.',
    type: 'CORPORATE',
    corporateKind: 'course',
    courseId: 'curso-lideranca',
    courseName: 'Liderança e Gestão de Pessoas',
    seats: 10,
    paymentMethod: 'PIX',
    total: 1970,
    createdAt: '2026-08-13T12:00:00.000Z',
    status: 'APPROVED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-13T12:00:00.000Z', description: 'Pagamento aprovado.' },
    ],
  },
  {
    id: '5',
    code: 'PED-00135',
    clientName: 'Carla Mendes',
    clientEmail: 'carla.mendes@email.com',
    clientPhone: '(31) 98888-1234',
    clientDocument: '456.789.123-00',
    type: 'INDIVIDUAL',
    courseId: 'curso-marketing',
    courseName: 'Marketing para Escape Rooms',
    seats: 1,
    paymentMethod: 'CARD',
    installments: 3,
    total: 247,
    createdAt: '2026-08-11T12:00:00.000Z',
    status: 'REFUNDED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-11T12:00:00.000Z', description: 'Pagamento aprovado.' },
      {
        status: 'REFUNDED',
        date: '2026-08-12T12:00:00.000Z',
        description: 'Reembolso solicitado pelo administrador.',
      },
    ],
  },
  {
    id: '6',
    code: 'PED-00133',
    clientName: 'Lucas Pereira',
    clientEmail: 'lucas.pereira@email.com',
    clientPhone: '(41) 99123-4567',
    clientDocument: '321.654.987-00',
    type: 'INDIVIDUAL',
    courseId: 'curso-design',
    courseName: 'Escape Room Design Avançado',
    seats: 1,
    paymentMethod: 'PIX',
    total: 297,
    createdAt: '2026-08-09T12:00:00.000Z',
    status: 'APPROVED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-09T12:00:00.000Z', description: 'Pagamento aprovado.' },
    ],
  },
  {
    id: '7',
    code: 'PED-00130',
    clientName: 'Imersão Total Ltda.',
    clientEmail: 'financeiro@imersao.com.br',
    clientPhone: '(11) 3333-4444',
    clientDocument: '11.222.333/0001-44',
    type: 'CORPORATE',
    corporateKind: 'seats',
    courseId: 'curso-gestao',
    courseName: 'Gestão de Experiências',
    seats: 3,
    paymentMethod: 'BOLETO',
    total: 711,
    createdAt: '2026-08-07T12:00:00.000Z',
    status: 'APPROVED',
    statusHistory: [
      { status: 'APPROVED', date: '2026-08-07T12:00:00.000Z', description: 'Pagamento aprovado.' },
    ],
  },
];

const matchesSearch = (order: OrderRow, term: string): boolean => {
  const value = term.trim().toLocaleLowerCase('pt-BR');
  if (!value) return true;

  return [order.code, order.clientName, order.clientEmail, order.courseName].some((field) =>
    field.toLocaleLowerCase('pt-BR').includes(value),
  );
};

const matchesFilters = (order: OrderRow, filters: OrderFiltersValue): boolean => {
  const orderDate = order.createdAt.slice(0, 10);

  return (
    (!filters.status || order.status === filters.status) &&
    (!filters.type || order.type === filters.type) &&
    (!filters.courseId || order.courseId === filters.courseId) &&
    (!filters.startDate || orderDate >= filters.startDate) &&
    (!filters.endDate || orderDate <= filters.endDate)
  );
};

const menuItems = SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({
  ...item,
  active: index === 0,
}));

const approvedOrders = ORDERS.filter((order) => order.status === 'APPROVED');
const approvedRevenue = approvedOrders.reduce((sum, order) => sum + order.total, 0);
const canceledOrRefundedCount = ORDERS.length - approvedOrders.length;

const columns: TableColumn<OrderRow>[] = [
  {
    id: 'code',
    header: 'ID pedido',
    align: 'start',
    render: (order) => <span className={styles.code}>{order.code}</span>,
  },
  {
    id: 'clientName',
    header: 'Solicitante',
    align: 'start',
    render: (order) => (
      <div className={styles.clientCell}>
        <span>{order.clientName}</span>
        {order.organizationName ? (
          <span className={styles.clientSecondary}>{order.organizationName}</span>
        ) : null}
      </div>
    ),
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
      order.type === 'CORPORATE'
        ? `${order.seats} ${order.seats === 1 ? 'assento' : 'assentos'}`
        : order.courseName,
  },
  {
    id: 'createdAt',
    header: 'Data da compra',
    render: (order) => formatLongDate(order.createdAt.slice(0, 10)),
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
    id: 'total',
    header: 'Valor',
    align: 'end',
    render: (order) => formatCurrency(order.total),
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
];

export const Ordermanagement = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OrderFiltersValue>(EMPTY_FILTERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () => ORDERS.filter((order) => matchesSearch(order, search) && matchesFilters(order, filters)),
    [filters, search],
  );

  const selectedOrder = ORDERS.find((order) => order.id === selectedOrderId) ?? null;
  const closeDetails = () => setSelectedOrderId(null);

  const tableColumns: TableColumn<OrderRow>[] = [
    ...columns,
    {
      id: 'actions',
      header: 'Ações',
      render: (order) => (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Ver pedido ${order.code}`}
            onClick={() => setSelectedOrderId(order.id)}
          >
            <Eye size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Reembolsar pedido ${order.code}`}
            title="Reembolso disponível na próxima etapa"
            disabled
          >
            <RotateCcw size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Cancelar pedido ${order.code}`}
            title="Cancelamento disponível na próxima etapa"
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
              placeholder="Buscar pedido"
              aria-label="Buscar pedido"
            />
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Resumo dos pedidos">
        <SumCard
          label="Receita aprovada"
          value={formatCurrency(approvedRevenue)}
          description={`${approvedOrders.length} pedidos ativos`}
        />

        <SumCard
          label="Pedidos Aprovados"
          value={approvedOrders.length}
          description="Acesso liberado automaticamente"
        />

        <SumCard
          label="Cancelados e reembolsados"
          value={canceledOrRefundedCount}
          description="Acesso revogado"
        />
      </section>

      <section className={styles.ordersPanel} aria-label="Listagem de pedidos">
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <h2>Pedidos</h2>
            <span aria-label={`${filteredOrders.length} pedidos`}>{filteredOrders.length}</span>
          </div>
          <div className={styles.panelControls}>
            <OrderFilters
              value={filters}
              onChange={setFilters}
              courses={COURSES}
              className={styles.inlineFilters}
            />
          </div>
        </header>

        <Table
          columns={tableColumns}
          data={filteredOrders}
          getRowId={(order) => order.id}
          caption="Pedidos da plataforma"
          emptyMessage="Nenhum pedido encontrado para os filtros selecionados."
          className={styles.ordersTable}
          footer={
            <div className={styles.tableFooter}>
              <p>
                Mostrando {filteredOrders.length} de {ORDERS.length} pedidos
              </p>
              <p className={styles.panelNote}>Liberação de acesso automática via checkout</p>
            </div>
          }
        />
      </section>

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          open
          onOpenChange={(open) => {
            if (!open) closeDetails();
          }}
        />
      ) : null}
    </AuthenticatedLayout>
  );
};
