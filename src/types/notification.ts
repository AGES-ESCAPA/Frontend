export type NotificationType =
  | 'COURSE_PUBLISHED'
  | 'COURSE_UPDATED'
  | 'COURSE_EXPIRING'
  | 'CERTIFICATE_ISSUED'
  | 'GENERAL'
  | 'LESSON_UPDATED';

export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  courseId: string | null;
  lessonId: string | null;
  read: boolean;
  /** Data local do servidor no formato ISO, sem fuso. */
  createdAt: string | null;
}

export interface NotificationList {
  notifications: UserNotification[];
  unreadCount: number;
}
