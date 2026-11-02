import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserNotification } from '@/types/notification';
import {
  getNotificationLink,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notificationService';

const notification: UserNotification = {
  id: 'n1',
  type: 'LESSON_UPDATED',
  title: 'Aula atualizada',
  message: 'Refaça a aula.',
  courseId: 'course-1',
  lessonId: 'lesson-1',
  read: false,
  createdAt: '2026-10-27T10:30:00',
};

describe('notificationService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should GET the notifications of the logged user', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, data: { notifications: [notification], unreadCount: 1 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await listNotifications();

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/notifications$/);
    expect(result).toEqual({ notifications: [notification], unreadCount: 1 });
  });

  it('should surface the API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Falha interna' }),
      }),
    );

    await expect(listNotifications()).rejects.toThrow('Falha interna');
  });

  it('should PATCH a single notification and all of them as read', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await markNotificationAsRead('n1');
    await markAllNotificationsAsRead();

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/notifications\/n1\/read$/);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/notifications\/read-all$/);
  });

  it('should link lesson notifications to the classroom', () => {
    expect(getNotificationLink(notification)).toBe('/aluno/cursos/course-1/aulas/lesson-1');
    expect(getNotificationLink({ ...notification, lessonId: null })).toBeNull();
  });
});
