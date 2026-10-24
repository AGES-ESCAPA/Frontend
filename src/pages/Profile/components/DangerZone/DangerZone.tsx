import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@components/ui';
import { DeactivateAccountModal } from '../DeactivateAccountModal';
import styles from './DangerZone.module.css';

export interface DangerZoneProps {
  /** Chamado depois que a API desativou a conta. */
  onDeactivated: () => void;
}

/** "Zona de Perigo" do perfil (FIGMA-16.1), exibida só para quem pode desativar a conta. */
export const DangerZone = ({ onDeactivated }: DangerZoneProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className={styles.zone} aria-labelledby="danger-zone-title">
      <header className={styles.header}>
        <AlertTriangle size={22} aria-hidden="true" />
        <h2 id="danger-zone-title" className={styles.title}>
          Zona de Perigo
        </h2>
      </header>
      <p className={styles.description}>
        Ao desativar sua conta, você perderá acesso a todos os cursos e certificados. Esta ação pode
        ser revertida entrando em contato com o suporte técnico da Escapa!
      </p>
      <div>
        <Button
          type="button"
          variant="danger"
          label="Desativar Minha Conta"
          onClick={() => setIsModalOpen(true)}
        />
      </div>
      <DeactivateAccountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onDeactivated={onDeactivated}
      />
    </section>
  );
};
