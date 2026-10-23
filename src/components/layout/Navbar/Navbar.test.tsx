import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

const renderNavbar = (component: ReactNode) => render(<MemoryRouter>{component}</MemoryRouter>);

describe('Navbar', () => {
  it('renders the noAuth variant with both actions', () => {
    renderNavbar(<Navbar state="noAuth" />);

    expect(screen.getByAltText('escapa!')).toBeInTheDocument();
    expect(screen.getByText('cursos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /acessar a plataforma/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('button', { name: 'Começar Agora' })).toBeInTheDocument();
  });

  it('renders the register variant without right-side actions', () => {
    renderNavbar(<Navbar state="register" />);

    expect(screen.getByText('cursos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Começar Agora' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('renders a user profile and notification badge', () => {
    renderNavbar(
      <Navbar state="user" user={{ name: 'Jorge Amado', role: 'Aluno' }} notificationsCount={3} />,
    );

    expect(screen.getByText('Jorge Amado')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByAltText('escapa!')).not.toBeInTheDocument();
  });

  it('caps the notification badge at 99+', () => {
    renderNavbar(
      <Navbar
        state="user"
        user={{ name: 'Jorge Amado', role: 'Aluno' }}
        notificationsCount={150}
      />,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders the company profile label', () => {
    renderNavbar(<Navbar state="company" user={{ name: 'Escapa', role: 'Empresa' }} />);

    expect(screen.getByText('Escapa')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('opens the profile menu and calls logout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderNavbar(
      <Navbar state="user" user={{ name: 'Jorge Amado', role: 'Aluno' }} onLogout={onLogout} />,
    );

    await user.click(screen.getByRole('button', { name: 'Perfil de Jorge Amado' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('uses the student profile route without reloading the application', async () => {
    const user = userEvent.setup();
    renderNavbar(<Navbar state="user" user={{ name: 'Jorge Amado', role: 'Aluno' }} />);

    await user.click(screen.getByRole('button', { name: 'Perfil de Jorge Amado' }));

    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toHaveAttribute(
      'href',
      '/meu-perfil',
    );
  });

  it('uses the company profile route', async () => {
    const user = userEvent.setup();
    renderNavbar(
      <Navbar
        state="company"
        user={{ name: 'Escapa', role: 'Empresa' }}
        profileHref="/empresa/perfil"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Perfil de Escapa' }));
    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toHaveAttribute(
      'href',
      '/empresa/perfil',
    );
  });

  it('hides the profile item for admins', async () => {
    const user = userEvent.setup();
    renderNavbar(
      <Navbar
        state="user"
        user={{ name: 'Admin', role: 'Administrador' }}
        showProfileLink={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Perfil de Admin' }));

    expect(screen.queryByRole('menuitem', { name: 'Meu perfil' })).not.toBeInTheDocument();
  });

  it('toggles the collapsible menu open and closed', async () => {
    const user = userEvent.setup();
    renderNavbar(<Navbar state="noAuth" />);

    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps profile and notifications inline when the menu is not collapsible', () => {
    renderNavbar(
      <Navbar
        state="user"
        collapsible={false}
        user={{ name: 'Jorge Amado', role: 'Aluno' }}
        notificationsCount={3}
      />,
    );

    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument();
    expect(screen.getByText('Jorge Amado')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('closes the collapsible menu on Escape', async () => {
    const user = userEvent.setup();
    renderNavbar(<Navbar state="user" user={{ name: 'Jorge Amado', role: 'Aluno' }} />);

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });
});
