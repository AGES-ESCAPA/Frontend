import { render, screen } from '@testing-library/react';
import { CourseInstructor } from './CourseInstructor';

describe('CourseInstructor', () => {
  it('renders the instructor identity and seed bio', () => {
    render(
      <CourseInstructor
        instructor={{
          name: 'Barbara Diogo',
          role: 'Pesquisadora em Gestão de Turismo & IA — ESCAPA!',
          bio: 'Formada em Gestão de Turismo, com MBA em Marketing Estratégico.',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Sobre o Instrutor' })).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Barbara Diogo')).toBeInTheDocument();
    expect(
      screen.getByText('Pesquisadora em Gestão de Turismo & IA — ESCAPA!'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Formada em Gestão de Turismo, com MBA em Marketing Estratégico.'),
    ).toBeInTheDocument();
  });

  it('renders the instructor photo when avatarUrl is present', () => {
    render(
      <CourseInstructor
        instructor={{
          name: 'Barbara Diogo',
          role: 'Pesquisadora',
          avatarUrl: 'http://localhost:9000/escapa-media/avatars/barbara-diogo.png',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Foto de Barbara Diogo' })).toHaveAttribute(
      'src',
      'http://localhost:9000/escapa-media/avatars/barbara-diogo.png',
    );
  });
});
