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
    renderItem();
    expect(screen.getByText('12 min')).toBeInTheDocument();
    expect(screen.getByText('Introdução ao React')).toHaveAttribute('title', 'Introdução ao React');
  });

  it('renderiza um link navegável quando liberada (AVAILABLE, COMPLETED ou isCurrent)', () => {
    // Testa apenas um cenário positivo para garantir que o link é gerado
    renderItem({ status: 'COMPLETED' });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/aula/1');
  });

  it('remove o link e sinaliza desabilitado quando LOCKED', () => {
    renderItem({ status: 'LOCKED' });

    // Garante que não tem link
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    // Pega a div em volta do texto e checa se está desabilitada
    const container = screen.getByText('Introdução ao React').closest('div');
    expect(container).toHaveAttribute('aria-disabled', 'true');
  });
});
