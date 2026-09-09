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

  it('should render the login CTA link', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /acessar a plataforma/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
