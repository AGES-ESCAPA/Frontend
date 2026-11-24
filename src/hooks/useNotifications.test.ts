import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { UserNotification } from '@/types/notification';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@services/notificationService';
import { useNotifications } from './useNotifications';

vi.mock('@services/notificationService', () => ({
  listNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

const listNotificationsMock = vi.mocked(listNotifications);
const markNotificationAsReadMock = vi.mocked(markNotificationAsRead);
const markAllNotificationsAsReadMock = vi.mocked(markAllNotificationsAsRead);

const notificationUnread: UserNotification = {
  id: 'n1',
  type: 'LESSON_UPDATED',
  title: 'Aula atualizada',
  message: 'Refaça a aula.',
  courseId: 'course-1',
  lessonId: 'lesson-1',
  read: false,
  createdAt: '2026-10-27T10:30:00',
};

const notificationRead: UserNotification = {
  ...notificationUnread,
  id: 'n2',
  title: 'Bem-vindo',
  read: true,
};

describe('useNotifications', () => {
  beforeEach(() => {
    listNotificationsMock.mockReset();
    markNotificationAsReadMock.mockReset().mockResolvedValue(undefined);
    markAllNotificationsAsReadMock.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should not load when disabled', async () => {
    listNotificationsMock.mockResolvedValue({
      notifications: [notificationUnread],
      unreadCount: 1,
    });

    const { result } = renderHook(() => useNotifications(false));

    await waitFor(() => {
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    expect(listNotificationsMock).not.toHaveBeenCalled();
  });

  it('should load notifications when enabled', async () => {
    listNotificationsMock.mockResolvedValue({
      notifications: [notificationUnread, notificationRead],
      unreadCount: 1,
    });

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual([notificationUnread, notificationRead]);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(listNotificationsMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('should expose the error when loading fails', async () => {
    listNotificationsMock.mockRejectedValue(new Error('Serviço indisponível.'));

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => expect(result.current.error).toBe('Serviço indisponível.'));
    expect(result.current.notifications).toEqual([]);
  });

  it('should mark a single notification as read optimistically', async () => {
    listNotificationsMock.mockResolvedValue({
      notifications: [notificationUnread, notificationRead],
      unreadCount: 1,
    });

    const { result } = renderHook(() => useNotifications(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markAsRead('n1'));

    expect(result.current.notifications.find((item) => item.id === 'n1')?.read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(markNotificationAsReadMock).toHaveBeenCalledWith('n1');
  });

  it('should mark all notifications as read optimistically', async () => {
    listNotificationsMock.mockResolvedValue({
      notifications: [notificationUnread, { ...notificationUnread, id: 'n3' }],
      unreadCount: 2,
    });

    const { result } = renderHook(() => useNotifications(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.markAllAsRead());

    expect(result.current.notifications.every((item) => item.read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(markAllNotificationsAsReadMock).toHaveBeenCalledTimes(1);
  });

  it('should refetch when enabled and refetch is called', async () => {
    listNotificationsMock.mockResolvedValue({ notifications: [], unreadCount: 0 });

    const { result } = renderHook(() => useNotifications(true));
    await waitFor(() => expect(listNotificationsMock).toHaveBeenCalledTimes(1));

    act(() => result.current.refetch());

    await waitFor(() => expect(listNotificationsMock).toHaveBeenCalledTimes(2));
  });

  it('should not refetch when disabled', async () => {
    const { result } = renderHook(() => useNotifications(false));

    act(() => result.current.refetch());

    expect(listNotificationsMock).not.toHaveBeenCalled();
  });

  it('should abort the in-flight request when unmounted', () => {
    listNotificationsMock.mockReturnValue(new Promise(() => undefined));

    const { unmount } = renderHook(() => useNotifications(true));
    const signal = listNotificationsMock.mock.calls[0][0] as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('should poll notifications every 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listNotificationsMock.mockResolvedValue({ notifications: [], unreadCount: 0 });

    renderHook(() => useNotifications(true));

    await waitFor(() => expect(listNotificationsMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    await waitFor(() => expect(listNotificationsMock).toHaveBeenCalledTimes(2));
  });
});
