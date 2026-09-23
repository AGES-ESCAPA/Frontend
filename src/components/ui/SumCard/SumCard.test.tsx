import { render, screen } from '@testing-library/react';
import { SumCard } from './SumCard';

describe('SumCard', () => {
  it('should render the label, value and description', () => {
    render(<SumCard label="Total de Cursos" value={4} description="Catálogo completo ativo" />);

    expect(screen.getByText('Total de Cursos')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Catálogo completo ativo')).toBeInTheDocument();
  });

  it('should expose the label as the accessible name of the card', () => {
    render(<SumCard label="Cursos Publicados" value={3} />);

    expect(screen.getByRole('article', { name: 'Cursos Publicados' })).toBeInTheDocument();
  });

  it('should omit the description when it is not provided', () => {
    const { container } = render(<SumCard label="Média de Preço" value="R$ 149" />);

    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});
