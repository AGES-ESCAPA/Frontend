import { render, screen } from '@testing-library/react';
import { SumCard } from './SumCard';
import styles from './SumCard.module.css';

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

  it('should keep a text value inside a paragraph', () => {
    render(<SumCard label="Total de Cursos" value={4} />);

    expect(screen.getByText('4').tagName).toBe('P');
  });

  it('should not nest a block value inside a paragraph', () => {
    render(<SumCard label="Conclusão" value={<section aria-label="Gráfico de conclusão" />} />);

    expect(screen.getByRole('region', { name: 'Gráfico de conclusão' }).closest('p')).toBeNull();
  });

  describe('trend', () => {
    const trendLabel = 'vs último mês';

    it('should show an up arrow in the positive tone when the value is positive', () => {
      const { container } = render(
        <SumCard label="Conclusão" value="78,4%" trend={{ value: 5.2, label: trendLabel }} />,
      );

      expect(screen.getByText('+5,2%').parentElement).toHaveClass(styles.trendPositive);
      expect(container.querySelector('.lucide-arrow-up')).toBeInTheDocument();
      expect(container.querySelector('.lucide-arrow-down')).not.toBeInTheDocument();
      expect(screen.getByText(trendLabel)).toBeInTheDocument();
    });

    it('should show a down arrow in the negative tone when the value is negative', () => {
      const { container } = render(
        <SumCard label="Conclusão" value="78,4%" trend={{ value: -3.1, label: trendLabel }} />,
      );

      expect(screen.getByText('-3,1%').parentElement).toHaveClass(styles.trendNegative);
      expect(container.querySelector('.lucide-arrow-down')).toBeInTheDocument();
      expect(container.querySelector('.lucide-arrow-up')).not.toBeInTheDocument();
    });

    it('should show no arrow and the neutral tone when the value is zero', () => {
      const { container } = render(
        <SumCard label="Conclusão" value="78,4%" trend={{ value: 0, label: trendLabel }} />,
      );

      expect(screen.getByText('0%').parentElement).toHaveClass(styles.trendNeutral);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it.each([
      [5.2, 'aumento de 5,2% em relação ao último mês'],
      [-3.1, 'queda de 3,1% em relação ao último mês'],
      [0, 'sem variação em relação ao último mês'],
    ])('should describe a variation of %d in full for screen readers', (value, expected) => {
      render(<SumCard label="Conclusão" value="78,4%" trend={{ value, label: trendLabel }} />);

      expect(screen.getByText(expected)).toHaveClass(styles.srOnly);
    });

    it('should hide the abbreviated variation from screen readers', () => {
      render(<SumCard label="Conclusão" value="78,4%" trend={{ value: 5.2, label: trendLabel }} />);

      expect(screen.getByText('+5,2%').closest('[aria-hidden="true"]')).toBeInTheDocument();
      expect(screen.getByText(trendLabel).closest('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('should keep a label without the "vs" prefix unchanged in the accessible text', () => {
      render(
        <SumCard
          label="Engajamento"
          value="89%"
          trend={{ value: 2.1, label: 'colaboradores ativos' }}
        />,
      );

      expect(screen.getByText('aumento de 2,1% colaboradores ativos')).toHaveClass(styles.srOnly);
    });

    it('should treat a variation that rounds to zero as no variation', () => {
      const { container } = render(
        <SumCard label="Conclusão" value="78,4%" trend={{ value: -0.04, label: trendLabel }} />,
      );

      expect(screen.getByText('0%').parentElement).toHaveClass(styles.trendNeutral);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      expect(screen.getByText('sem variação em relação ao último mês')).toBeInTheDocument();
    });

    it('should skip the trend line when the value is not a finite number', () => {
      const { container } = render(
        <SumCard
          label="Conclusão"
          value="78,4%"
          trend={{ value: Number.NaN, label: trendLabel }}
        />,
      );

      expect(screen.queryByText(trendLabel)).not.toBeInTheDocument();
      expect(container.querySelectorAll('p')).toHaveLength(2);
    });

    it('should render the trend between the value and the description', () => {
      const { container } = render(
        <SumCard
          label="Conclusão"
          value="78,4%"
          description="Média geral"
          trend={{ value: 5.2, label: trendLabel }}
        />,
      );

      const lines = Array.from(container.querySelectorAll('p'));
      expect(lines).toHaveLength(4);
      expect(lines[1]).toHaveTextContent('78,4%');
      expect(lines[2]).toHaveTextContent('+5,2%');
      expect(lines[3]).toHaveTextContent('Média geral');
    });

    it('should render only label, value and description when there is no trend', () => {
      const { container } = render(
        <SumCard label="Conclusão" value="78,4%" description="Média geral" />,
      );

      expect(container.querySelectorAll('p')).toHaveLength(3);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });
});
