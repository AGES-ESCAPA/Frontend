import { Bell } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';
import type { UserNotification } from '@/types/notification';
import { getNotificationLink } from '@services/notificationService';
import navbarStyles from './Navbar.module.css';
import styles from './NotificationsMenu.module.css';

export interface NavbarNotifications {
  items: UserNotification[];
  unreadCount: number;
  isLoading?: boolean;
  error?: string | null;
  /** Chamado ao abrir o menu, para buscar avisos novos. */
  onOpen?: () => void;
  /** Chamado ao escolher uma notificação, antes de navegar para o link dela. */
  onSelect?: (notification: UserNotification) => void;
  onMarkAllAsRead?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

const NotificationContent = ({ notification }: { notification: UserNotification }) => {
  const date = formatDate(notification.createdAt);

  return (
    <>
      {!notification.read && <span className={styles.unreadDot} aria-label="Não lida" />}
      <span className={styles.itemTexts}>
        <strong>{notification.title}</strong>
        {notification.message && <span>{notification.message}</span>}
        {date && <small>{date}</small>}
      </span>
    </>
  );
};

export const NotificationsMenu = ({
  items,
  unreadCount,
  isLoading = false,
  error = null,
  onOpen,
  onSelect,
  onMarkAllAsRead,
}: NavbarNotifications) => {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (open) onOpen?.();
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={navbarStyles.notificationButton}
          aria-label={unreadCount > 0 ? `Notificações (${badgeLabel} não lidas)` : 'Notificações'}
        >
          <Bell size={16} aria-hidden="true" />
          {unreadCount > 0 && <span className={navbarStyles.badge}>{badgeLabel}</span>}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.menu} align="end" sideOffset={8}>
          <div className={styles.header}>
            <DropdownMenu.Label className={styles.title}>Notificações</DropdownMenu.Label>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button type="button" className={styles.markAllButton} onClick={onMarkAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className={styles.emptyState} role="status">
              {error ??
                (isLoading ? 'Carregando notificações...' : 'Nenhuma notificação por aqui.')}
            </p>
          ) : (
            <div className={styles.list}>
              {items.map((notification) => {
                const link = getNotificationLink(notification);
                const itemClassName = `${styles.item} ${notification.read ? '' : styles.unread}`;

                return link ? (
                  <DropdownMenu.Item key={notification.id} asChild className={itemClassName}>
                    <Link to={link} onClick={() => onSelect?.(notification)}>
                      <NotificationContent notification={notification} />
                    </Link>
                  </DropdownMenu.Item>
                ) : (
                  <DropdownMenu.Item
                    key={notification.id}
                    className={itemClassName}
                    onSelect={() => onSelect?.(notification)}
                  >
                    <NotificationContent notification={notification} />
                  </DropdownMenu.Item>
                );
              })}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
