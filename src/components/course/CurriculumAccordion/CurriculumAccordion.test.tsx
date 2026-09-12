import { fireEvent, render, screen } from '@testing-library/react';
import { CurriculumAccordion } from './CurriculumAccordion';
import { featuredCourse } from '@/data/courses';

describe('CurriculumAccordion', () => {
  it('opens the first module and toggles lessons', () => {
    render(<CurriculumAccordion modules={featuredCourse.modules} />);

    expect(screen.getByText('O que é Inteligência Artificial?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fundamentos de ia/i }));
    expect(screen.queryByText('O que é Inteligência Artificial?')).not.toBeInTheDocument();
  });

  it('opens a secondary module and renders its lessons', () => {
    render(<CurriculumAccordion modules={featuredCourse.modules} />);

    fireEvent.click(screen.getByRole('button', { name: /chatgpt e modelos/i }));

    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();
    expect(screen.getAllByText('GRÁTIS')).toHaveLength(3);
  });
});
