import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render the label text', () => {
    render(<Badge label="Marketing" category="marketing" />);
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('should resolve the correct variant class from category', () => {
    render(<Badge label="Marketing" category="marketing" />);
    expect(screen.getByText('Marketing').className).toMatch(/variant-secondary/);
  });

  it('should fall back to neutral when category is unknown', () => {
    render(<Badge label="Outros" category="categoria-inexistente" />);
    expect(screen.getByText('Outros').className).toMatch(/variant-neutral/);
  });

  it('should prioritize explicit variant over category', () => {
    render(<Badge label="Avançado" category="avancado" variant="info" />);
    expect(screen.getByText('Avançado').className).toMatch(/variant-info/);
  });

  it('should not wrap text (white-space nowrap applied via module class)', () => {
    render(<Badge label="Inteligência Artificial" category="ia" />);
    expect(screen.getByText('Inteligência Artificial').className).toMatch(/badge/);
  });
});
