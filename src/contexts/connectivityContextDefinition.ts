import { createContext } from 'react';

export interface ConnectivityContextValue {
  /** Espelha `navigator.onLine` (atualizado via eventos `online`/`offline`). */
  isOnline: boolean;
  /**
   * Banner de offline só após um atraso — micro-quedas não aparecem na UI.
   */
  showOfflineBanner: boolean;
  /** Feedback curto depois que a conexão volta. */
  justReconnected: boolean;
  /**
   * Incrementa a cada reconexão. Hooks podem observar para refetch automático.
   */
  reconnectGeneration: number;
}

export const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);
