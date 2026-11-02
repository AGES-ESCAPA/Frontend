/**
 * services/notificationService.ts
 *
 * Notificações do usuário autenticado (sino da Navbar).
 */
import { authenticatedFetch, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import { getApiBaseUrl } from '@services/runtimeEnv';
import type { NotificationList, UserNotification } from '@/types/notification';

const API_BASE_URL = getApiBaseUrl();

export const listNotifications = async (signal?: AbortSignal): Promise<NotificationList> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    throw new Error(
      (await readApiErrorMessage(response)) ?? 'Não foi possível carregar as notificações.',
    );
  }

  const json: ApiResponse<NotificationList> = await response.json();

  return json.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    throw new Error(
      (await readApiErrorMessage(response)) ?? 'Não foi possível marcar a notificação como lida.',
    );
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(
      (await readApiErrorMessage(response)) ??
        'Não foi possível marcar as notificações como lidas.',
    );
  }
};

/** Rota do front para onde a notificação leva; `null` quando ela não aponta para nada. */
export const getNotificationLink = (notification: UserNotification): string | null => {
  if (notification.courseId && notification.lessonId) {
    return `/aluno/cursos/${notification.courseId}/aulas/${notification.lessonId}`;
  }

  return null;
};
