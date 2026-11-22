import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('should render title and optional eyebrow and subtitle', () => {
    render(
      <PageHeader
        eyebrow="Área do Aluno • Meus Cursos"
        title="Meus Cursos"
        subtitle="Continue de onde você parou"
      />,
    );

    expect(screen.getByText('Área do Aluno • Meus Cursos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Meus Cursos' })).toBeInTheDocument();
    expect(screen.getByText('Continue de onde você parou')).toBeInTheDocument();
  });

  it('should omit eyebrow and subtitle when they are not provided', () => {
    const { container } = render(<PageHeader title="Gestão de Pedidos" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Gestão de Pedidos' }),
    ).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });
});
