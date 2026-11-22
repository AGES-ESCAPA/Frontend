import { Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '@contexts/useConnectivity';
import styles from './ConnectionBanner.module.css';

/**
 * Faixa global de conectividade. Só aparece após queda sustentada ou
 * brevemente na recuperação — micro-instabilidades não chegam aqui.
 */
export const ConnectionBanner = () => {
  const { showOfflineBanner, justReconnected } = useConnectivity();

  if (!showOfflineBanner && !justReconnected) return null;

  if (showOfflineBanner) {
    return (
      <div
        className={`${styles.banner} ${styles.offline}`}
        role="status"
        aria-live="polite"
        data-testid="connection-banner-offline"
      >
        <WifiOff className={styles.icon} aria-hidden />
        <p className={styles.text}>
          Sem conexão. Continuamos com os dados desta sessão; as alterações serão sincronizadas ao
          voltar.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.banner} ${styles.online}`}
      role="status"
      aria-live="polite"
      data-testid="connection-banner-online"
    >
      <Wifi className={styles.icon} aria-hidden />
      <p className={styles.text}>Conexão restabelecida. Atualizando os dados…</p>
    </div>
  );
};
