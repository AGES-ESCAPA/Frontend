import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { LessonNavItem } from './LessonNavItem';

const renderItem = (props: Partial<ComponentProps<typeof LessonNavItem>> = {}) =>
  render(
    <MemoryRouter>
      <LessonNavItem
        title="Introdução ao Turismo"
        durationMinutes={12}
        status="AVAILABLE"
        href="/courses/1/lessons/1"
        {...props}
      />
    </MemoryRouter>,
  );

describe('LessonNavItem', () => {
  it('should render the lesson title and duration in minutes', () => {
    renderItem();
    expect(screen.getByText('Introdução ao Turismo')).toBeInTheDocument();
    expect(screen.getByText('12 min')).toBeInTheDocument();
  });

  it('should render as a navigable link when status is AVAILABLE', () => {
    renderItem({ status: 'AVAILABLE' });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/1/lessons/1');
  });

  it('should render as a navigable link when status is COMPLETED', () => {
    renderItem({ status: 'COMPLETED' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/courses/1/lessons/1');
    expect(link.className).toMatch(/completed/);
  });

  it('should apply the current visual state regardless of status', () => {
    renderItem({ status: 'COMPLETED', isCurrent: true });
    expect(screen.getByRole('link').className).toMatch(/current/);
  });

  it('should mark the current lesson with aria-current="page"', () => {
    renderItem({ isCurrent: true });
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('should render locked lessons as non-interactive text', () => {
    renderItem({ status: 'LOCKED' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const item = screen.getByText('Introdução ao Turismo').closest('[aria-disabled]');
    expect(item).toHaveAttribute('aria-disabled', 'true');
  });

  it('should expose the full title via the title attribute for truncated text', () => {
    const longTitle = 'Um título de aula bastante longo para ser truncado na sidebar';
    renderItem({ title: longTitle });
    expect(screen.getByText(longTitle)).toHaveAttribute('title', longTitle);
  });
});
