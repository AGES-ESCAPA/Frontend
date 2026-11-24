import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CoursePrerequisiteOption } from '@/types/course';
import { PrerequisiteCoursesCard } from './PrerequisiteCoursesCard';

const courseA: CoursePrerequisiteOption = {
  id: 'course-a',
  title: 'Curso A',
};

const courseB: CoursePrerequisiteOption = {
  id: 'course-b',
  title: 'Curso B',
};

describe('PrerequisiteCoursesCard', () => {
  it('hides already selected suggestions and supports add/remove actions', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onAdd = vi.fn();
    const onRemove = vi.fn();

    render(
      <PrerequisiteCoursesCard
        selected={[courseA]}
        suggestions={[courseA, courseB]}
        query=""
        onQueryChange={onQueryChange}
        onAdd={onAdd}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText('Curso A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Curso B' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Curso A' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Curso B' }));
    expect(onAdd).toHaveBeenCalledWith(courseB);

    await user.click(screen.getByRole('button', { name: /remover curso a dos pré-requisitos/i }));
    expect(onRemove).toHaveBeenCalledWith('course-a');

    await user.type(
      screen.getByRole('textbox', { name: /buscar cursos para adicionar como pré-requisito/i }),
      'IA',
    );
    expect(onQueryChange).toHaveBeenCalled();
  });
});
