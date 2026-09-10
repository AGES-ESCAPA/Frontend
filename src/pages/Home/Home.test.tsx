import { render, screen } from '@testing-library/react';
import { Home } from './Home';

describe('Home', () => {
  it('should render the escapa! logo image', () => {
    render(<Home />);
    const logo = screen.getByRole('img', { name: /escapa! - plataforma de cursos/i });
    expect(logo).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Home />);
    expect(screen.getByText(/plataforma de cursos/i)).toBeInTheDocument();
  });

  it('should render one courses link for each role', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Aluno' })).toHaveAttribute(
      'href',
      '/courses?role=student',
    );
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/courses?role=admin',
    );
    expect(screen.getByRole('link', { name: 'Empresa' })).toHaveAttribute(
      'href',
      '/courses?role=company',
    );
  });
});
