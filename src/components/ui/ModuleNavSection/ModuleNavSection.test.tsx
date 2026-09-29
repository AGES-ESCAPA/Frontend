import type { ComponentProps } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleNavSection } from './ModuleNavSection';

const MODULE_ID = 'module-1';

const lessons: ComponentProps<typeof ModuleNavSection>['lessons'] = [
  {
    id: 'lesson-1',
    title: 'Introdução ao Turismo de Aventura',
    durationMinutes: 12,
    status: 'COMPLETED',
  },
  {
    id: 'lesson-2',
    title: 'Planejamento de Roteiros Turísticos',
    durationMinutes: 18,
    status: 'COMPLETED',
  },
  {
    id: 'lesson-3',
    title: 'Experiências Imersivas na Prática',
    durationMinutes: 24,
    status: 'AVAILABLE',
  },
  {
    id: 'lesson-4',
    title: 'Pesquisa de Destinos e Público-Alvo',
    durationMinutes: 21,
    status: 'LOCKED',
  },
];

const renderSection = (
  props: Partial<ComponentProps<typeof ModuleNavSection>> = {},
  { open = true }: { open?: boolean } = {},
) =>
  render(
    <MemoryRouter>
      <Accordion.Root type="multiple" defaultValue={open ? [MODULE_ID] : []}>
        <ModuleNavSection
          moduleId={MODULE_ID}
          title="Fundamentos do Turismo Receptivo"
          completedLessons={2}
          totalLessons={4}
          locked={false}
          lessons={lessons}
          currentLessonId="lesson-3"
          buildLessonHref={(lessonId) => `/aluno/cursos/course-1/aulas/${lessonId}`}
          {...props}
        />
      </Accordion.Root>
    </MemoryRouter>,
  );

const getTrigger = () => screen.getByRole('button', { name: /Fundamentos do Turismo Receptivo/ });

describe('ModuleNavSection', () => {
  it('should render the module title and the completion counter in the header', () => {
    renderSection();

    expect(getTrigger()).toHaveTextContent('Fundamentos do Turismo Receptivo');
    expect(getTrigger()).toHaveTextContent('2/4 concluídas');
  });

  it('should list the lessons in order with their hrefs when open', () => {
    renderSection();

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('Introdução ao Turismo de Aventura'),
      expect.stringContaining('Planejamento de Roteiros Turísticos'),
      expect.stringContaining('Experiências Imersivas na Prática'),
    ]);
    expect(links[0]).toHaveAttribute('href', '/aluno/cursos/course-1/aulas/lesson-1');
  });

  it('should hide the lessons when closed', () => {
    renderSection({}, { open: false });

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Introdução ao Turismo de Aventura')).not.toBeInTheDocument();
  });

  it('should toggle the lesson list when the header is clicked', async () => {
    const user = userEvent.setup();
    renderSection({}, { open: false });

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Introdução ao Turismo de Aventura')).toBeInTheDocument();

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Introdução ao Turismo de Aventura')).not.toBeInTheDocument();
  });

  it('should render the lesson matching currentLessonId as the current one', () => {
    renderSection();

    const current = screen.getByRole('link', { current: 'page' });
    expect(current).toHaveTextContent('Experiências Imersivas na Prática');
    expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1);
  });

  it('should show a lock icon for a locked module and keep it expandable', async () => {
    const user = userEvent.setup();
    renderSection(
      { locked: true, completedLessons: 0, currentLessonId: undefined },
      { open: false },
    );

    expect(screen.getByLabelText('Módulo bloqueado')).toBeInTheDocument();
    expect(getTrigger()).toHaveTextContent('0/4 concluídas');

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Introdução ao Turismo de Aventura')).toBeInTheDocument();
  });

  it('should render every lesson of a locked module as locked', () => {
    renderSection({ locked: true, currentLessonId: undefined });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    lessons.forEach((lesson) => {
      expect(screen.getByText(lesson.title).closest('[aria-disabled]')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('should not show the lock icon for an unlocked module', () => {
    renderSection();

    expect(screen.queryByLabelText('Módulo bloqueado')).not.toBeInTheDocument();
  });
});
