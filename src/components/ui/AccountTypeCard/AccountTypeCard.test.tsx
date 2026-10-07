import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { User } from 'lucide-react';
import { describe, it, expect } from 'vitest';
import { AccountTypeCard } from './AccountTypeCard';

function renderCard(overrides = {}) {
  const props = {
    title: 'Pessoa Física',
    description: 'Cadastre-se como indivíduo e acesse nossos serviços com facilidade.',
    icon: <User size={24} />,
    to: '/cadastro/pessoa-fisica',
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <AccountTypeCard {...props} />
    </MemoryRouter>,
  );
}

describe('AccountTypeCard', () => {
  it('renderiza título, descrição e ícone', () => {
    renderCard({ icon: <svg data-testid="icon-test" /> });
    expect(screen.getByText('Pessoa Física')).toBeInTheDocument();
    expect(
      screen.getByText('Cadastre-se como indivíduo e acesse nossos serviços com facilidade.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('icon-test')).toBeInTheDocument();
  });

  it('o card inteiro é um link apontando para a rota correta', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'Pessoa Física' });
    expect(link).toHaveAttribute('href', '/cadastro/pessoa-fisica');
  });

  it.each(['/cadastro/pessoa-fisica', '/cadastro/empresa'])(
    'navega corretamente para a rota "%s"',
    (to) => {
      renderCard({ to });
      const link = screen.getByRole('link', { name: 'Pessoa Física' });
      expect(link).toHaveAttribute('href', to);
    },
  );

  it('tem aria-label igual ao título para leitores de tela', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'Pessoa Física' });
    expect(link).toHaveAttribute('aria-label', 'Pessoa Física');
  });

  it('recebe foco pelo teclado', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'Pessoa Física' });
    link.focus();
    expect(link).toHaveFocus();
  });
});
