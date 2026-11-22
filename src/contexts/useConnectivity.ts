import { useContext, useEffect, useRef } from 'react';
import { ConnectivityContext } from './connectivityContextDefinition';
import type { ConnectivityContextValue } from './connectivityContextDefinition';

const FALLBACK: ConnectivityContextValue = {
  isOnline: true,
  showOfflineBanner: false,
  justReconnected: false,
  reconnectGeneration: 0,
};

/** Seguro fora do provider (testes/story): assume online. */
export const useConnectivity = (): ConnectivityContextValue =>
  useContext(ConnectivityContext) ?? FALLBACK;

/**
 * Dispara `onReconnect` a cada vez que a conexão volta (após ter caído).
 * Não dispara na montagem inicial.
 */
export const useNetworkRecovery = (onReconnect: () => void): void => {
  const { reconnectGeneration } = useConnectivity();
  const callbackRef = useRef(onReconnect);
  callbackRef.current = onReconnect;
  const previousRef = useRef(reconnectGeneration);

  useEffect(() => {
    if (previousRef.current === reconnectGeneration) return;
    previousRef.current = reconnectGeneration;
    if (reconnectGeneration > 0) callbackRef.current();
  }, [reconnectGeneration]);
};
