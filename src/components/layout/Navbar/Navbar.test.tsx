import { render, screen } from '@testing-library/react';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it.each([
    ['noAuth', 'Começar Agora'],
    ['register', 'cursos'],
  ] as const)('renders the %s variant', (state, expectedText) => {
    render(<Navbar state={state} />);

    expect(screen.getByAltText('escapa!')).toBeInTheDocument();
    expect(screen.getByText(expectedText)).toBeInTheDocument();
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

  it('renders the company profile label', () => {
    render(<Navbar state="company" user={{ name: 'Escapa', role: 'Empresa' }} />);

    expect(screen.getByText('Escapa')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });
});
