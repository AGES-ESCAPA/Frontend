import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render the full institutional footer', () => {
    render(
      <Footer variant="full" year={2026} categories={['Turismo', 'Hospitalidade', 'Inovação']} />,
    );

    expect(screen.getByRole('contentinfo', { name: /rodapé institucional/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /escapa!/i })).toBeInTheDocument();
    expect(screen.getByText(/plataforma de educação premium/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /plataforma/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /empresa/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /minha conta/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /sobre a escapa!/i })).toHaveAttribute(
      'href',
      '/sobre',
    );
    expect(
      screen.getByText('© 2026 Escapa! Cursos. Todos os direitos reservados.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Turismo · Hospitalidade · Inovação')).toBeInTheDocument();
  });

  it('should render the compact footer with legal links', () => {
    render(<Footer variant="compact" year={2026} />);

    expect(screen.getByRole('contentinfo', { name: /rodapé compacto/i })).toBeInTheDocument();
    expect(
      screen.getByText('© 2026 Escapa! Cursos. Todos os direitos reservados.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /política de privacidade/i })).toHaveAttribute(
      'href',
      '/politica-de-privacidade',
    );
    expect(screen.getByRole('link', { name: /termos de uso/i })).toHaveAttribute(
      'href',
      '/termos-de-uso',
    );
    expect(screen.getByRole('link', { name: /suporte/i })).toHaveAttribute('href', '/suporte');
  });

  it('should use the current year when year is not provided', () => {
    const currentYear = new Date().getFullYear();

    render(<Footer variant="compact" />);

    expect(
      screen.getByText(`© ${currentYear} Escapa! Cursos. Todos os direitos reservados.`),
    ).toBeInTheDocument();
  });
});
