import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { StudentCurriculum } from '@/types/curriculum';
import { LessonMenu, type LessonMenuProps } from './LessonMenu';

const COURSE_ID = 'e0000000-0000-4000-e000-000000000005';

const curriculum: StudentCurriculum = {
  courseId: COURSE_ID,
  completedLessons: 1,
  totalLessons: 2,
  modules: [
    {
      id: '01000000-0000-4000-9000-000000000018',
      title: 'Módulo 1',
      locked: false,
      completedLessons: 1,
      totalLessons: 2,
      lessons: [
        {
          id: '02000000-0000-4000-9000-000000000182',
          title: 'Introdução ao curso',
          durationMinutes: 10,
          status: 'COMPLETED',
        },
        {
          id: '02000000-0000-4000-9000-000000000183',
          title: 'Mapeando a jornada do hóspede',
          durationMinutes: 12,
          status: 'AVAILABLE',
        },
      ],
    },
  ],
};

const renderMenu = (props: Partial<LessonMenuProps> = {}) =>
  render(
    <MemoryRouter>
      <LessonMenu
        data={null}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        currentLessonId="02000000-0000-4000-9000-000000000182"
        buildLessonHref={(lessonId) => `/aluno/cursos/${COURSE_ID}/aulas/${lessonId}`}
        {...props}
      />
    </MemoryRouter>,
  );

describe('LessonMenu', () => {
  it('should render the skeleton while loading', () => {
    renderMenu({ isLoading: true });

    expect(screen.getByRole('status', { name: 'Carregando conteúdo do curso' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should render the course navigation with the curriculum data', () => {
    renderMenu({ data: curriculum });

    expect(screen.getByRole('navigation', { name: 'Conteúdo do curso' })).toBeInTheDocument();

    expect(screen.getByText('1/2')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Mapeando a jornada do hóspede/ })).toHaveAttribute(
      'href',
      `/aluno/cursos/${COURSE_ID}/aulas/02000000-0000-4000-9000-000000000183`,
    );
  });

  it('should keep showing the current data during a refetch', () => {
    renderMenu({ data: curriculum, isLoading: true });

    expect(screen.getByRole('navigation', { name: 'Conteúdo do curso' })).toBeInTheDocument();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should render the error with a retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderMenu({ error: { status: 503, message: 'Service Unavailable' }, onRetry });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o conteúdo do curso.',
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render the error with a retry action on a network failure', () => {
    renderMenu({ error: { status: null, message: 'Falha de rede' } });

    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it.each([400, 403, 404])('should render nothing when the API answers %i', (status) => {
    const { container } = renderMenu({ error: { status, message: 'Erro' } });

    expect(container).toBeEmptyDOMElement();
  });
});
