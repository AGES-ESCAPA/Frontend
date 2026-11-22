import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConnectivityContext } from './connectivityContextDefinition';
import type { ConnectivityContextValue } from './connectivityContextDefinition';

/** Só mostra o banner se a queda durar mais que isto — evita flicker. */
const OFFLINE_BANNER_DELAY_MS = 1_200;
/** Tempo do aviso “Conexão restabelecida”. */
const RECONNECTED_BANNER_MS = 2_400;

export const ConnectivityProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [reconnectGeneration, setReconnectGeneration] = useState(0);

  const offlineTimerRef = useRef<number | undefined>(undefined);
  const reconnectedTimerRef = useRef<number | undefined>(undefined);
  const wasOfflineRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (offlineTimerRef.current !== undefined) {
      window.clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = undefined;
    }
    if (reconnectedTimerRef.current !== undefined) {
      window.clearTimeout(reconnectedTimerRef.current);
      reconnectedTimerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setJustReconnected(false);
      if (offlineTimerRef.current === undefined) {
        offlineTimerRef.current = window.setTimeout(() => {
          setShowOfflineBanner(true);
          offlineTimerRef.current = undefined;
        }, OFFLINE_BANNER_DELAY_MS);
      }
    };

    const handleOnline = () => {
      if (offlineTimerRef.current !== undefined) {
        window.clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = undefined;
      }

      setIsOnline(true);
      setShowOfflineBanner(false);

      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setReconnectGeneration((current) => current + 1);
        setJustReconnected(true);
        if (reconnectedTimerRef.current !== undefined) {
          window.clearTimeout(reconnectedTimerRef.current);
        }
        reconnectedTimerRef.current = window.setTimeout(() => {
          setJustReconnected(false);
          reconnectedTimerRef.current = undefined;
        }, RECONNECTED_BANNER_MS);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimers();
    };
  }, [clearTimers]);

  const value = useMemo<ConnectivityContextValue>(
    () => ({
      isOnline,
      showOfflineBanner,
      justReconnected,
      reconnectGeneration,
    }),
    [isOnline, showOfflineBanner, justReconnected, reconnectGeneration],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
};
