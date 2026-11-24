import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="Nenhum curso"
        description="Publique seu primeiro curso para aparecer aqui."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nenhum curso' })).toBeInTheDocument();
    expect(screen.getByText('Publique seu primeiro curso para aparecer aqui.')).toBeInTheDocument();
  });

  it('renders an optional action area', () => {
    render(
      <EmptyState
        title="Sem resultados"
        description="Ajuste os filtros."
        action={<button type="button">Limpar filtros</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });
});
