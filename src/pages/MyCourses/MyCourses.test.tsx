import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyCourses } from './MyCourses';

describe('MyCourses', () => {
  it('renders student cards from the page mocks', () => {
    render(<MyCourses />);

    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Aguardando' })).toHaveLength(3);
  });

  it('filters the cards by enrollment status', async () => {
    render(<MyCourses />);

    await userEvent.click(screen.getByRole('tab', { name: 'Aguardando' }));

    expect(screen.getAllByRole('button', { name: 'Aguardando' })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Continuar Aula' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Visualizar Certificado' }),
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when the search has no matches', async () => {
    render(<MyCourses />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Buscar meus cursos' }), 'xyzxyz');

    expect(screen.getByText('Nenhum curso encontrado com estes filtros.')).toBeInTheDocument();
  });
});
