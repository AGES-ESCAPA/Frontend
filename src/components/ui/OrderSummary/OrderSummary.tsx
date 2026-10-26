import { Clock3, UsersRound } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import { maskCnpj, normalizeCnpj, onlyDigits } from '@utils/masks';
import { CourseCover } from './CourseCover';
import styles from './OrderSummary.module.css';

export type OrderItem =
  | {
      kind: 'course';
      title: string;
      imageUrl: string;
      duration: string;
      price: number;
    }
  | {
      kind: 'seats';
      quantity: number;
      total: number;
    };

export interface OrderBuyer {
  kind: 'individual' | 'company';
  name: string;
  email?: string;
  /** CPF do aluno ou CNPJ (numérico ou alfanumérico) da empresa, com ou sem pontuação. */
  document: string;
}

export interface OrderSummaryProps {
  item?: OrderItem;
  buyer?: OrderBuyer;
  discount?: number;
  paymentMethod?: string;
  status?: 'loading' | 'error' | 'success';
  errorMessage?: string;
}

/** Mostra só o fim do documento, no formato das máscaras de CPF e CNPJ (US-21). */
const maskBuyerDocument = (document: string, kind: OrderBuyer['kind']): string => {
  if (kind === 'individual') {
    const digits = onlyDigits(document);
    return digits.length === 11
      ? `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`
      : 'Documento indisponível';
  }

  return normalizeCnpj(document).length === 14
    ? `**.***.***/${maskCnpj(document).slice(11)}`
    : 'Documento indisponível';
};

const SummarySkeleton = () => (
  <section className={styles.card} role="status" aria-label="Carregando resumo do pedido">
    <div className={styles.skeletonBody} aria-hidden="true">
      <span className={`${styles.bone} ${styles.coverBone}`} />
      <span className={`${styles.bone} ${styles.titleBone}`} />
      <span className={`${styles.bone} ${styles.lineBone}`} />
      <span className={`${styles.bone} ${styles.lineBone}`} />
      <span className={`${styles.bone} ${styles.lineBoneShort}`} />
    </div>
  </section>
);

export const OrderSummary = ({
  item,
  buyer,
  discount = 0,
  paymentMethod,
  status = 'success',
  errorMessage,
}: OrderSummaryProps) => {
  if (status === 'loading') {
    return <SummarySkeleton />;
  }

  if (status === 'error') {
    return (
      <section className={styles.card} role="alert">
        {errorMessage || 'Não foi possível carregar o resumo do pedido.'}
      </section>
    );
  }

  if (!item) {
    return (
      <section className={styles.card} role="status">
        Nenhum item no pedido.
      </section>
    );
  }

  const subtotal = item.kind === 'course' ? item.price : item.total;
  const total = Math.max(0, subtotal - Math.max(0, discount));

  return (
    <section className={styles.card} aria-label="Resumo do pedido">
      {item.kind === 'course' ? (
        <div className={styles.course}>
          <CourseCover imageUrl={item.imageUrl} title={item.title} />

          <div>
            <h2 className={styles.title}>{item.title}</h2>

            <p className={styles.muted}>
              <Clock3 size={16} aria-hidden="true" />
              {item.duration}
            </p>

            <p className={styles.price}>{formatCurrency(item.price)}</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.hero}>
            <UsersRound size={64} strokeWidth={2} aria-hidden="true" />
            <span>COMPRA DE ASSENTOS</span>
          </div>

          <div className={styles.content}>
            <h2 className={styles.title}>Pacote de {item.quantity} Assentos Corporativos</h2>

            <p className={styles.muted}>
              Disponibiliza {item.quantity} vagas para cadastrar colaboradores vinculados à conta da
              empresa na plataforma
            </p>

            <p className={styles.quantity}>
              <UsersRound size={16} aria-hidden="true" />
              {item.quantity} colaboradores
            </p>
          </div>
        </>
      )}

      <dl className={styles.details}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(subtotal)}</dd>
        </div>

        <div>
          <dt>Desconto</dt>
          <dd>{discount > 0 ? `− ${formatCurrency(discount)}` : '–'}</dd>
        </div>

        {paymentMethod && (
          <div>
            <dt>Forma de Pagamento</dt>
            <dd>{paymentMethod}</dd>
          </div>
        )}

        <div className={styles.total}>
          <dt>Total</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>

      {buyer && (
        <div className={styles.buyer}>
          <h3>Dados do comprador</h3>
          <p>{buyer.name}</p>
          {buyer.email ? <p>{buyer.email}</p> : null}
          <p>
            {buyer.kind === 'individual' ? 'CPF' : 'CNPJ'}:{' '}
            {maskBuyerDocument(buyer.document, buyer.kind)}
          </p>
        </div>
      )}

      {item.kind === 'seats' && (
        <p className={styles.notice}>
          Atenção: A compra de assentos não libera cursos — apenas habilita o cadastro de novos
          colaboradores na empresa.
        </p>
      )}
    </section>
  );
};
