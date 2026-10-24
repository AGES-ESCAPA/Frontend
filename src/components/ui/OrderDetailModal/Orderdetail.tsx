import type { ReactNode } from 'react';
import { Modal } from '../Modal';
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../OrderFilters';
import type { OrderStatus } from '../OrderFilters';
import { CreditCard } from 'lucide-react';
import {
  PAYMENT_ICONS,
  formatCurrency,
  formatDate,
  formatDateTime,
  type OrderRow,
} from './Orderdetail.constants';
import styles from './Orderdetail.module.css';

export type OrderDetailModalProps = {
  order: OrderRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: ReactNode;
};

type StatusTone = 'info' | 'success' | 'warning' | 'error';

const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  APPROVED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'warning',
};

const headerTone = (status: OrderStatus): StatusTone =>
  STATUS_TONE[status] === 'success' ? 'info' : STATUS_TONE[status];

const DetailItem = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className={styles.detailItem}>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

const paymentLabel = (order: OrderRow): string => {
  if (order.installments && order.installments > 1) {
    const installmentValue = order.total / order.installments;
    return `${order.paymentMethod} em ${order.installments}x de ${formatCurrency(installmentValue)}`;
  }
  return order.paymentMethod;
};

const accessLabel = (order: OrderRow): string => {
  if (order.type === 'CORPORATE' && order.corporateKind === 'course') {
    return order.seats === 1
      ? '1 colaborador com acesso'
      : `${order.seats} colaboradores com acesso`;
  }
  if (order.type === 'CORPORATE' && order.corporateKind === 'seats') {
    return order.seats === 1 ? '1 assento' : `${order.seats} assentos`;
  }
  return '1 acesso individual';
};

const sortedHistory = (order: OrderRow) =>
  [...order.statusHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const OrderDetailModal = ({ order, open, onOpenChange, actions }: OrderDetailModalProps) => {
  const isCorporate = order.type === 'CORPORATE';
  const PaymentIcon = PAYMENT_ICONS[order.paymentMethod] ?? CreditCard;

  const footer = actions ? <div className={styles.modalActions}>{actions}</div> : undefined;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      subtitle="Detalhe do pedido"
      subtitleAboveTitle
      title={order.code}
      size="sm"
      footer={footer}
    >
      <div className={styles.root}>
        {/* Status e valor */}
        <div className={styles.statusRow}>
          <span className={styles.statusBadge} data-tone={headerTone(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className={styles.value}>{formatCurrency(order.total)}</span>
        </div>

        {/* Dados do comprador */}
        <section aria-labelledby="order-buyer-heading">
          <h2 id="order-buyer-heading" className={styles.sectionTitle}>
            Dados do comprador
          </h2>
          <dl className={styles.detailGrid}>
            <DetailItem label="Nome">{order.clientName}</DetailItem>
            <DetailItem label="E-mail">{order.clientEmail}</DetailItem>
            {order.clientDocument ? (
              <DetailItem label={isCorporate ? 'CNPJ' : 'CPF'}>{order.clientDocument}</DetailItem>
            ) : null}
            {order.clientPhone ? (
              <DetailItem label="Telefone">{order.clientPhone}</DetailItem>
            ) : null}
            {order.organizationName ? (
              <DetailItem label="Empresa">{order.organizationName}</DetailItem>
            ) : null}
            <DetailItem label="Tipo de conta">{ORDER_TYPE_LABELS[order.type]}</DetailItem>
          </dl>
        </section>

        {/* Itens do pedido */}
        <section aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className={styles.sectionTitle}>
            Itens do pedido
          </h2>
          <div className={styles.itemsCard}>
            <div className={styles.itemsCardHeader}>
              <h3 className={styles.itemsCardTitle}>{order.courseName}</h3>
              <span className={styles.itemsCardPrice}>{formatCurrency(order.total)}</span>
            </div>
            <p className={styles.itemsCardMeta}>{accessLabel(order)}</p>
            <div className={styles.itemsCardPayment}>
              <PaymentIcon size={16} aria-hidden="true" />
              <span>
                {paymentLabel(order)} · {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
        </section>

        {/* Histórico de status */}
        <section className={styles.history} aria-labelledby="order-history-heading">
          <h2 id="order-history-heading" className={styles.sectionTitle}>
            Histórico de status
          </h2>
          <ol>
            {sortedHistory(order).map((entry, index) => (
              <li
                key={`${entry.status}-${entry.date}-${index}`}
                data-tone={headerTone(entry.status)}
              >
                <div className={styles.historyBody}>
                  <div className={styles.historyTop}>
                    <span className={styles.historyBadge} data-tone={STATUS_TONE[entry.status]}>
                      {ORDER_STATUS_LABELS[entry.status]}
                    </span>
                    <time dateTime={entry.date}>{formatDateTime(entry.date)}</time>
                  </div>
                  <p className={styles.historyDesc}>{entry.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
};

export { OrderDetailModal as Orderdetail };
