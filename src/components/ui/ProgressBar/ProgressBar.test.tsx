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

    const bar = screen.getByRole('progressbar', { name: 'Curso concluído' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.className).toMatch(/success/);
  });

  it('uses the default appearance when no variant is given', () => {
    render(<ProgressBar value={40} aria-label="Progresso" />);

    expect(screen.getByRole('progressbar').className).not.toMatch(/success|chart/);
  });

  it('supports a chart appearance without changing its value', () => {
    render(<ProgressBar value={46} variant="chart" aria-label="Recepção" />);

    const bar = screen.getByRole('progressbar', { name: 'Recepção' });
    expect(bar).toHaveAttribute('aria-valuenow', '46');
    expect(bar.className).toMatch(/chart/);
  });

  it('should announce the percentage when no valueLabel is given', () => {
    render(<ProgressBar value={3} max={4} aria-label="Progresso" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '75%');
  });

  it('should announce the given valueLabel instead of the percentage', () => {
    render(<ProgressBar value={259} max={259} valueLabel="259" aria-label="Costa Verde" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '259');
  });
});
