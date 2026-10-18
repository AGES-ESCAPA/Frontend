import { Clock3, UsersRound } from 'lucide-react';
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

export type OrderBuyer =
  | {
      kind: 'individual';
      name: string;
      document: string;
    }
  | {
      kind: 'company';
      name: string;
      document: string;
    };

export interface OrderSummaryProps {
  item?: OrderItem;
  buyer?: OrderBuyer;
  discount?: number;
  paymentMethod?: string;
  status?: 'loading' | 'error' | 'success';
  errorMessage?: string;
}

const currency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const maskBuyerDocument = (document: string, kind: OrderBuyer['kind']): string => {
  const digits = document.replace(/\D/g, '');

  if (kind === 'individual' && digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (kind === 'company' && digits.length === 14) {
    return `**.***.***/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return 'Documento indisponível';
};

export const OrderSummary = ({
  item,
  buyer,
  discount = 0,
  paymentMethod,
  status = 'success',
  errorMessage,
}: OrderSummaryProps) => {
  if (status === 'loading') {
    return (
      <section className={styles.card} role="status">
        Carregando resumo do pedido...
      </section>
    );
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
          <img className={styles.cover} src={item.imageUrl} alt={`Capa do curso ${item.title}`} />

          <div>
            <h2 className={styles.title}>{item.title}</h2>

            <p className={styles.muted}>
              <Clock3 size={16} aria-hidden="true" />
              {item.duration}
            </p>

            <p className={styles.price}>{currency(item.price)}</p>
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
          <dd>{currency(subtotal)}</dd>
        </div>

        <div>
          <dt>Desconto</dt>
          <dd>{discount > 0 ? `− ${currency(discount)}` : '–'}</dd>
        </div>

        {paymentMethod && (
          <div>
            <dt>Forma de Pagamento</dt>
            <dd>{paymentMethod}</dd>
          </div>
        )}

        <div className={styles.total}>
          <dt>Total</dt>
          <dd>{currency(total)}</dd>
        </div>
      </dl>

      {buyer && (
        <div className={styles.buyer}>
          <h3>Dados do comprador</h3>
          <p>{buyer.name}</p>
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
