import { render, screen } from '@testing-library/react';
import { CourseMaterials } from './CourseMaterials';
import { featuredCourse } from '@/data/courses';

describe('CourseMaterials', () => {
  it('renders included materials without download actions', () => {
    render(<CourseMaterials materials={featuredCourse.materials} />);

    expect(screen.getByRole('heading', { name: 'Materiais Inclusos' })).toBeInTheDocument();
    expect(screen.getByText('Guia de Prompts para Turismo (PDF)')).toBeInTheDocument();
    expect(screen.getByText('Planilha de Automação de Processos (Excel)')).toBeInTheDocument();
    expect(screen.getByText('Mapa de Ferramentas de IA 2025 (PDF)')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
