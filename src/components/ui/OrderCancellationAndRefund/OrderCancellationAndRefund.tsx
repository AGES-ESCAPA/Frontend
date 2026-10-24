import { useState } from 'react';
import { CircleX, RotateCcw } from 'lucide-react';
import type { OrderRow } from '@components/ui/OrderDetailModal/OrderDetailModal.constants';
import type { OrderManagementAction } from '@services/orderCancellationMockService';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import styles from './OrderCancellationAndRefund.module.css';

export interface OrderCancellationAndRefundProps {
  order: OrderRow;
  isSubmitting?: boolean;
  onAction: (action: OrderManagementAction) => Promise<void>;
}

const ACTION_DETAILS = {
  cancel: {
    title: 'Confirmar cancelamento',
    description:
      'O cancelamento revoga o acesso ao curso. O progresso concluído pelo aluno será preservado.',
    confirmLabel: 'Confirmar cancelamento',
    actionLabel: 'Cancelar pedido',
    Icon: CircleX,
  },
  refund: {
    title: 'Confirmar reembolso',
    description:
      'O registro do reembolso não altera o progresso do aluno. O acesso continuará revogado.',
    confirmLabel: 'Confirmar reembolso',
    actionLabel: 'Reembolsar pedido',
    Icon: RotateCcw,
  },
} as const;

export const OrderCancellationAndRefund = ({
  order,
  isSubmitting = false,
  onAction,
}: OrderCancellationAndRefundProps) => {
  const [actionToConfirm, setActionToConfirm] = useState<OrderManagementAction | null>(null);

  if (order.status === 'REFUNDED') return null;

  const action: OrderManagementAction = order.status === 'APPROVED' ? 'cancel' : 'refund';
  const details = ACTION_DETAILS[action];
  const Icon = details.Icon;
  const closeConfirmation = (open: boolean) => {
    if (!open && !isSubmitting) setActionToConfirm(null);
  };

  const confirmAction = async () => {
    await onAction(action);
    setActionToConfirm(null);
  };

  return (
    <>
      <Button
        type="button"
        className={`${styles.labelButton} ${
          action === 'cancel' ? styles.cancelButton : styles.refundButton
        }`}
        variant={action === 'cancel' ? 'danger' : 'outlined'}
        label={details.actionLabel}
        icon={<Icon size={18} aria-hidden="true" />}
        disabled={isSubmitting}
        onClick={() => setActionToConfirm(action)}
      />

      <ConfirmDialog
        open={actionToConfirm !== null}
        title={details.title}
        description={details.description}
        confirmLabel={details.confirmLabel}
        isConfirming={isSubmitting}
        onConfirm={confirmAction}
        onOpenChange={closeConfirmation}
      />
    </>
  );
};
