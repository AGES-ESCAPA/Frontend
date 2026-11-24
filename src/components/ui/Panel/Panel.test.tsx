import { render, screen } from '@testing-library/react';
import { BookOpen } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Panel } from './Panel';

describe('Panel', () => {
  it('renders children without a header when title is omitted', () => {
    render(
      <Panel>
        <p>Conteúdo livre</p>
      </Panel>,
    );

    expect(screen.getByText('Conteúdo livre')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders icon, title and header actions', () => {
    render(
      <Panel
        title="Módulos"
        icon={<BookOpen data-testid="panel-icon" />}
        actions={<span data-testid="panel-action">v2</span>}
      >
        <p>Lista de módulos</p>
      </Panel>,
    );

    expect(screen.getByRole('heading', { name: 'Módulos' })).toBeInTheDocument();
    expect(screen.getByTestId('panel-icon')).toBeInTheDocument();
    expect(screen.getByTestId('panel-action')).toBeInTheDocument();
    expect(screen.getByText('Lista de módulos')).toBeInTheDocument();
  });
});
