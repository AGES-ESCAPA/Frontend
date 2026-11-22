import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CurriculumAccordion } from './CurriculumAccordion';
import { featuredCourse } from '@/data/courses';

const renderAccordion = () =>
  render(
    <MemoryRouter>
      <CurriculumAccordion courseId={featuredCourse.id} modules={featuredCourse.modules} />
    </MemoryRouter>,
  );

describe('CurriculumAccordion', () => {
  it('keeps all modules open by default and toggles lessons', () => {
    renderAccordion();

    expect(screen.getByText('O que é Inteligência Artificial?')).toBeInTheDocument();
    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /fundamentos de ia/i }));

    expect(screen.queryByText('O que é Inteligência Artificial?')).not.toBeInTheDocument();
    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();
  });

  it('renders lessons of every module while they remain open', () => {
    renderAccordion();

    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();
    expect(screen.getByText('Mapeando Processos Repetitivos')).toBeInTheDocument();
    expect(screen.getByText('Projeto Aplicado ao seu Negócio')).toBeInTheDocument();
    expect(screen.getAllByText('GRÁTIS')).toHaveLength(4);
  });
});
