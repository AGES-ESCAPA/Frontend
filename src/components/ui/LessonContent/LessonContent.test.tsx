import { render, screen } from '@testing-library/react';
import { LessonContent } from './LessonContent';

const mockDescription =
  'Nesta aula, exploramos como criar experiências turísticas imersivas.\n' +
  'Estudamos cases reais de destinos como Fernando de Noronha e Chapada dos Veadeiros.';

const mockConcepts = [
  'turismo de experiência',
  'economia criativa',
  'roteiros sensoriais',
  'hospitalidade autêntica',
];

describe('LessonContent', () => {
  it('renderiza o título "Sobre esta aula"', () => {
    render(<LessonContent description="Texto." concepts={[]} />);
    expect(screen.getByText('Sobre esta aula')).toBeInTheDocument();
  });

  it('renderiza um parágrafo simples', () => {
    render(<LessonContent description="Texto curto da aula." concepts={[]} />);
    expect(screen.getByText('Texto curto da aula.')).toBeInTheDocument();
  });

  it('renderiza múltiplos parágrafos sem perda de formatação', () => {
    render(<LessonContent description={mockDescription} concepts={[]} />);
    expect(
      screen.getByText('Nesta aula, exploramos como criar experiências turísticas imersivas.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Estudamos cases reais de destinos como Fernando de Noronha e Chapada dos Veadeiros.',
      ),
    ).toBeInTheDocument();
  });

  it('não renderiza a linha de conceitos quando concepts está vazio', () => {
    render(<LessonContent description="Descrição qualquer." concepts={[]} />);
    expect(screen.queryByText(/Conceitos abordados/)).not.toBeInTheDocument();
  });

  it('renderiza o label e os conceitos quando a lista não está vazia', () => {
    render(<LessonContent description="Descrição." concepts={mockConcepts} />);
    expect(screen.getByText('Conceitos abordados:')).toBeInTheDocument();
    expect(screen.getByText(/turismo de experiência/)).toBeInTheDocument();
    expect(screen.getByText(/hospitalidade autêntica/)).toBeInTheDocument();
  });
});
