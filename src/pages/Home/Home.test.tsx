import { render, screen } from '@testing-library/react';
import { Home } from './Home';

describe('Home', () => {
  it('should render the catalog title', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /cursos em destaque/i })).toBeInTheDocument();
  });

  it('should render the catalog subtitle', () => {
    render(<Home />);
    expect(screen.getByText(/todos os cursos/i)).toBeInTheDocument();
  });

  it('should render the login CTA link', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /acessar a plataforma/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
