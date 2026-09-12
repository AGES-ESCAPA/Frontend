import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render the label text', () => {
    render(<Badge label="Marketing" category="marketing" />);
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('should resolve the correct variant class from category', () => {
    render(<Badge label="Marketing" category="marketing" />);
    expect(screen.getByText('Marketing').className).toMatch(/variant-success/);
  });

  it('should fall back to neutral when category is unknown', () => {
    render(<Badge label="Outros" category="categoria-inexistente" />);
    expect(screen.getByText('Outros').className).toMatch(/variant-neutral/);
  });

  it('should prioritize explicit variant over category', () => {
    render(<Badge label="Avançado" category="avancado" variant="info" />);
    expect(screen.getByText('Avançado').className).toMatch(/variant-info/);
  });

  it('should use the level variant for the course details modal', () => {
    render(<Badge label="Iniciante" variant="level" />);
    expect(screen.getByText('Iniciante').className).toMatch(/variant-level/);
  });

  it('should not wrap text (white-space nowrap applied via module class)', () => {
    render(<Badge label="Inteligência Artificial" category="ia" />);
    expect(screen.getByText('Inteligência Artificial').className).toMatch(/badge/);
  });

  it('should use the primary variant for Inteligência Artificial', () => {
    render(<Badge category="ai" />);
    expect(screen.getByText('Inteligência Artificial').className).toMatch(/variant-primary/);
  });

  it('should use Figma variants for Hospitalidade and Inovação', () => {
    const { rerender } = render(<Badge category="hospitality" />);
    expect(screen.getByText('Hospitalidade').className).toMatch(/variant-info/);

    rerender(<Badge category="innovation" />);
    expect(screen.getByText('Inovação').className).toMatch(/variant-secondary/);

    rerender(<Badge category="Turismo" />);
    expect(screen.getByText('Turismo').className).toMatch(/variant-warning/);
  });
});
