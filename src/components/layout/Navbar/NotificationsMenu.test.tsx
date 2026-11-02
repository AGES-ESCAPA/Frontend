import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { UserNotification } from '@/types/notification';
import { Navbar } from './Navbar';
import type { NavbarNotifications } from './NotificationsMenu';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';
const LESSON_ID = '02000000-0000-4000-9000-000000000182';

const lessonUpdated: UserNotification = {
  id: 'n1',
  type: 'LESSON_UPDATED',
  title: 'Aula atualizada',
  message: 'A aula "Check-in" recebeu atualizações. Refaça a aula para conferir o conteúdo novo.',
  courseId: COURSE_ID,
  lessonId: LESSON_ID,
  read: false,
  createdAt: '2026-10-27T10:30:00',
};

const general: UserNotification = {
  id: 'n2',
  type: 'GENERAL',
  title: 'Bem-vindo',
  message: null,
  courseId: null,
  lessonId: null,
  read: true,
  createdAt: '2026-10-20T09:00:00',
};

const LocationProbe = () => <output>{useLocation().pathname}</output>;

const renderMenu = (notifications: Partial<NavbarNotifications> = {}) => {
  const props: NavbarNotifications = {
    items: [lessonUpdated, general],
    unreadCount: 1,
    onOpen: vi.fn(),
    onSelect: vi.fn(),
    onMarkAllAsRead: vi.fn(),
    ...notifications,
  };

  render(
    <MemoryRouter initialEntries={['/meus-cursos']}>
      <Navbar
        state="user"
        user={{ name: 'Jorge Amado', role: 'Aluno' }}
        notificationsCount={42}
        notifications={props}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

  return props;
};

describe('NotificationsMenu', () => {
  it('shows the real unread count instead of the static count', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Notificações (1 não lidas)' })).toHaveTextContent(
      '1',
    );
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('lists the notifications and refreshes them when opened', async () => {
    const user = userEvent.setup();
    const props = renderMenu();

    await user.click(screen.getByRole('button', { name: /notificações/i }));

    expect(props.onOpen).toHaveBeenCalled();
    expect(screen.getByText('Aula atualizada')).toBeInTheDocument();
    expect(screen.getByText(/recebeu atualizações/i)).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });

  it('links the lesson update to the lesson and marks it as read', async () => {
    const user = userEvent.setup();
    const props = renderMenu();

    await user.click(screen.getByRole('button', { name: /notificações/i }));
    const item = screen.getByRole('menuitem', { name: /aula atualizada/i });

    expect(item).toHaveAttribute('href', `/aluno/cursos/${COURSE_ID}/aulas/${LESSON_ID}`);

    await user.click(item);

    expect(props.onSelect).toHaveBeenCalledWith(lessonUpdated);
    expect(screen.getByRole('status')).toHaveTextContent(
      `/aluno/cursos/${COURSE_ID}/aulas/${LESSON_ID}`,
    );
  });

  it('marks every notification as read', async () => {
    const user = userEvent.setup();
    const props = renderMenu();

    await user.click(screen.getByRole('button', { name: /notificações/i }));
    await user.click(screen.getByRole('button', { name: /marcar todas como lidas/i }));

    expect(props.onMarkAllAsRead).toHaveBeenCalled();
  });

  it('shows an empty state', async () => {
    const user = userEvent.setup();
    renderMenu({ items: [], unreadCount: 0 });

    await user.click(screen.getByRole('button', { name: 'Notificações' }));

    expect(screen.getByText('Nenhuma notificação por aqui.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /marcar todas/i })).not.toBeInTheDocument();
  });
});
