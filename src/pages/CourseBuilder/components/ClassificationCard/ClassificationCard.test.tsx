import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CourseFormField } from '@/types/course';
import { ClassificationCard } from './ClassificationCard';

vi.mock('./CategoryCombobox', () => ({
  CategoryCombobox: ({
    onChange,
    value,
  }: {
    onChange: (category: string) => void;
    value: string;
  }) => (
    <button type="button" onClick={() => onChange('Hospitalidade')}>
      Selecionar categoria ({value || 'vazio'})
    </button>
  ),
}));

const defaultProps = {
  category: '',
  difficulty: '',
  featured: false,
  categories: ['Design & UX', 'Hospitalidade'],
  onFieldChange: vi.fn<(field: CourseFormField, value: string) => void>(),
  onFeaturedChange: vi.fn(),
};

describe('ClassificationCard', () => {
  it('forwards category, difficulty and featured changes', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn<(field: CourseFormField, value: string) => void>();
    const onFeaturedChange = vi.fn();

    render(
      <ClassificationCard
        {...defaultProps}
        onFieldChange={onFieldChange}
        onFeaturedChange={onFeaturedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /selecionar categoria/i }));
    expect(onFieldChange).toHaveBeenCalledWith('category', 'Hospitalidade');

    await user.click(screen.getByRole('button', { name: 'Intermediário' }));
    expect(onFieldChange).toHaveBeenCalledWith('difficulty', 'INTERMEDIARIO');

    await user.click(screen.getByRole('checkbox', { name: /adicionar curso em destaque/i }));
    expect(onFeaturedChange).toHaveBeenCalledWith(true);
  });

  it('shows validation errors when provided', () => {
    render(
      <ClassificationCard
        {...defaultProps}
        categoryError="Selecione uma categoria."
        difficultyError="Selecione um nível de dificuldade."
      />,
    );

    expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('Selecione um nível de dificuldade.')).toBeInTheDocument();
  });
});
