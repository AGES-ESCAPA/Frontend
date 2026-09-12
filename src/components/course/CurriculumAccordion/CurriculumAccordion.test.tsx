import { fireEvent, render, screen } from '@testing-library/react';
import { CurriculumAccordion } from './CurriculumAccordion';
import { featuredCourse } from '@/data/courses';

describe('CurriculumAccordion', () => {
  it('keeps all modules open by default and toggles lessons', () => {
    render(<CurriculumAccordion modules={featuredCourse.modules} />);

    expect(screen.getByText('O que é Inteligência Artificial?')).toBeInTheDocument();
    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /fundamentos de ia/i }));

    expect(screen.queryByText('O que é Inteligência Artificial?')).not.toBeInTheDocument();
    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();
  });

  it('renders lessons of every module while they remain open', () => {
    render(<CurriculumAccordion modules={featuredCourse.modules} />);

    expect(screen.getByText('Prompts para Experiências Turísticas')).toBeInTheDocument();
    expect(screen.getByText('Mapeando Processos Repetitivos')).toBeInTheDocument();
    expect(screen.getByText('Projeto Aplicado ao seu Negócio')).toBeInTheDocument();
    expect(screen.getAllByText('GRÁTIS')).toHaveLength(4);
  });
});
