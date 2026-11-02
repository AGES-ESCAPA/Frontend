import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserNotification } from '@/types/notification';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@services/notificationService';

export interface UseNotificationsResult {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const POLL_INTERVAL_MS = 60_000;

/**
 * Notificações do usuário logado. Recarrega periodicamente para o sino
 * refletir avisos novos (ex.: aula atualizada) sem recarregar a página.
 * Marcar como lida é otimista: a falha na API não desfaz o estado local.
 */
export const useNotifications = (enabled: boolean): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);

    try {
      const result = await listNotifications(controller.signal);
      if (controller.signal.aborted) return;

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError(null);
    } catch (loadError: unknown) {
      if (controller.signal.aborted) return;

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as notificações.',
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    void load();
    const intervalId = window.setInterval(() => void load(), POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      controllerRef.current?.abort();
    };
  }, [enabled, load]);

  const refetch = useCallback(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      const target = notifications.find((notification) => notification.id === notificationId);
      if (!target || target.read) return;

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      markNotificationAsRead(notificationId).catch(() => undefined);
    },
    [notifications],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    markAllNotificationsAsRead().catch(() => undefined);
  }, []);

  return { notifications, unreadCount, isLoading, error, refetch, markAsRead, markAllAsRead };
};
