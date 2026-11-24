import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import type { CourseLesson } from '@/types/course';
import { LessonItem } from './LessonItem';

const COURSE_ID = 'course-1';

const freeVideoLesson: CourseLesson = {
  id: 'lesson-1',
  title: 'Introdução ao turismo',
  type: 'video',
  durationMinutes: 12,
  isFree: true,
};

const lockedLesson: CourseLesson = {
  id: 'lesson-2',
  title: 'Conteúdo exclusivo',
  type: 'text',
  durationMinutes: 8,
  isFree: false,
};

const renderItem = (lesson: CourseLesson, auth: AuthContextValue | null = null) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <ul>
          <LessonItem courseId={COURSE_ID} lesson={lesson} />
        </ul>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

describe('LessonItem', () => {
  it('links free lessons for authenticated learners', () => {
    renderItem(freeVideoLesson, {
      user: { id: 's1', name: 'Aluno', email: 'a@x.com', role: 'STUDENT' },
      isAuthenticated: true,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    const link = screen.getByRole('link', { name: /introdução ao turismo/i });
    expect(link).toHaveAttribute('href', `/aluno/cursos/${COURSE_ID}/aulas/${freeVideoLesson.id}`);
    expect(screen.getByText('GRÁTIS')).toBeInTheDocument();
  });

  it('sends guests to login when the lesson is free', () => {
    renderItem(freeVideoLesson, null);

    const link = screen.getByRole('link', { name: /introdução ao turismo/i });
    expect(link).toHaveAttribute(
      'href',
      `/login?returnTo=%2Faluno%2Fcursos%2F${COURSE_ID}%2Faulas%2F${freeVideoLesson.id}`,
    );
  });

  it('keeps locked lessons as plain list items', () => {
    renderItem(lockedLesson, {
      user: { id: 's1', name: 'Aluno', email: 'a@x.com', role: 'STUDENT' },
      isAuthenticated: true,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Aula bloqueada')).toBeInTheDocument();
    expect(screen.getByText('8min')).toBeInTheDocument();
  });
});
