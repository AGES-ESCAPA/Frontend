import { render, screen } from '@testing-library/react';
import { LessonContent } from './LessonContent';
import { describe, it, expect } from 'vitest';

describe('LessonContent', () => {
  it('exibe descrição em parágrafos e conceitos como tags', () => {
    render(
      <LessonContent
        description={'Primeiro parágrafo.\nSegundo parágrafo.'}
        concepts={['React', 'Hooks']}
      />,
    );

    expect(screen.getByText('Sobre esta aula')).toBeInTheDocument();
    expect(screen.getByText('Primeiro parágrafo.')).toBeInTheDocument();
    expect(screen.getByText('Segundo parágrafo.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it.each<string | null | undefined>([null, undefined, '', '   '])(
    'não renderiza descrição quando é %p',
    (description) => {
      render(<LessonContent description={description} concepts={['React']} />);
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.queryByText('Primeiro parágrafo.')).not.toBeInTheDocument();
    },
  );

  it('não renderiza nada quando não há descrição nem conceitos', () => {
    const { container } = render(<LessonContent description={null} concepts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each<string[] | null | undefined>([null, undefined, []])(
    'oculta conceitos quando é %p',
    (concepts) => {
      render(<LessonContent description="Texto" concepts={concepts} />);
      expect(screen.getByText('Texto')).toBeInTheDocument();
      expect(screen.queryByText('Conceitos abordados')).not.toBeInTheDocument();
    },
  );

  it('exibe skeleton durante o carregamento', () => {
    render(<LessonContent isLoading />);
    expect(screen.getByTestId('lesson-content-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Sobre esta aula')).not.toBeInTheDocument();
  });
});
