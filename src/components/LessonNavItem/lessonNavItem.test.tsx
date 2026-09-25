import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessonNavItem } from './lessonNavItem';

type LessonNavItemTestProps = Partial<{
  title: string;
  durationMinutes: number;
  status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED';
  isCurrent: boolean;
  href: string;
}>;

const renderItem = (props: LessonNavItemTestProps = {}) => {
  // Centraliza a renderização para que cada teste altere apenas o cenário relevante.
  return render(
    <MemoryRouter>
      <LessonNavItem
        title="Introdução ao React"
        durationMinutes={12}
        href="/aula/1"
        status="AVAILABLE"
        {...props}
      />
    </MemoryRouter>,
  );
};

describe('LessonNavItem', () => {
  it('exibe o título com title (truncamento) e a duração formatada', () => {
    // Confirma as informações básicas que o aluno precisa identificar a aula.
    renderItem();
    expect(screen.getByText('12 min')).toBeInTheDocument();
    expect(screen.getByText('Introdução ao React')).toHaveAttribute('title', 'Introdução ao React');
  });

  it('renderiza um link navegável quando liberada (AVAILABLE, COMPLETED ou isCurrent)', () => {
    // Um cenário positivo é suficiente para verificar que aulas acessíveis geram navegação.
    renderItem({ status: 'COMPLETED' });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/aula/1');
  });

  it('remove o link e sinaliza desabilitado quando LOCKED', () => {
    // A aula bloqueada deve ser apenas informativa e não permitir acesso.
    renderItem({ status: 'LOCKED' });

    // Garante que o usuário não pode navegar para a aula bloqueada.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    // Expõe o estado bloqueado para tecnologias assistivas.
    const container = screen.getByText('Introdução ao React').closest('div');
    expect(container).toHaveAttribute('aria-disabled', 'true');
  });
});
