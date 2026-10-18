import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UnderConstruction } from './UnderConstruction';

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <UnderConstruction />
    </MemoryRouter>,
  );

describe('UnderConstruction', () => {
  it('should explain that the page is under construction', () => {
    renderPage('/politica-de-privacidade');

    expect(screen.getByRole('heading', { name: 'Página em construção' })).toBeInTheDocument();
    expect(screen.getByText(/estamos preparando esta área/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('should keep the authenticated shell on menu routes without a page', () => {
    renderPage('/meu-perfil');

    expect(screen.getByRole('heading', { name: 'Página em construção' })).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: /aluno/i });
    expect(within(navigation).getByRole('link', { name: 'Cursos' })).toHaveAttribute(
      'href',
      '/aluno/cursos',
    );
    expect(screen.getByRole('link', { name: 'Ir para Cursos' })).toHaveAttribute(
      'href',
      '/aluno/cursos',
    );
  });
});
