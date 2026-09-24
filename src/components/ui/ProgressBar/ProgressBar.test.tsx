import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('should expose the current progress as a percentage of max', () => {
    render(<ProgressBar value={3} max={4} aria-label="Cursos publicados" />);

    const bar = screen.getByRole('progressbar', { name: 'Cursos publicados' });
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should clamp values below zero to an empty bar', () => {
    render(<ProgressBar value={-10} aria-label="Progresso" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('should clamp values above max to a full bar', () => {
    render(<ProgressBar value={150} max={100} aria-label="Progresso" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('should treat a zero max as an empty bar', () => {
    render(<ProgressBar value={2} max={0} aria-label="Progresso" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('supports a success appearance without changing its value', () => {
    render(<ProgressBar value={100} variant="success" aria-label="Curso concluído" />);

    expect(screen.getByRole('progressbar', { name: 'Curso concluído' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });
});
