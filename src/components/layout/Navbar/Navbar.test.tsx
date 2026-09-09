import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('renders the noAuth variant with both actions', () => {
    render(<Navbar state="noAuth" />);

    expect(screen.getByAltText('escapa!')).toBeInTheDocument();
    expect(screen.getByText('cursos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /acessar a plataforma/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('button', { name: 'Começar Agora' })).toBeInTheDocument();
  });

  it('renders the register variant without right-side actions', () => {
    render(<Navbar state="register" />);

    expect(screen.getByText('cursos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Começar Agora' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('renders a user profile and notification badge', () => {
    render(
      <Navbar
        state="user"
        user={{ name: 'Jorge Amado', role: 'Estudante' }}
        notificationsCount={3}
      />,
    );

    expect(screen.getByText('Jorge Amado')).toBeInTheDocument();
    expect(screen.getByText('Estudante')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps the notification badge at 99+', () => {
    render(
      <Navbar
        state="user"
        user={{ name: 'Jorge Amado', role: 'Estudante' }}
        notificationsCount={150}
      />,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders the company profile label', () => {
    render(<Navbar state="company" user={{ name: 'Escapa', role: 'Empresa' }} />);

    expect(screen.getByText('Escapa')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('toggles the collapsible menu open and closed', async () => {
    const user = userEvent.setup();
    render(<Navbar state="noAuth" />);

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

  it('closes the collapsible menu on Escape', async () => {
    const user = userEvent.setup();
    render(<Navbar state="user" user={{ name: 'Jorge Amado', role: 'Estudante' }} />);

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });
});
