import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CourseCover } from './CourseCover';

describe('CourseCover', () => {
  it('renders the image when the URL is valid', () => {
    render(<CourseCover title="Turismo Rural" imageUrl="https://cdn.escapa.com/capa.jpg" />);

    expect(screen.getByRole('img', { name: 'Capa do curso Turismo Rural' })).toHaveAttribute(
      'src',
      'https://cdn.escapa.com/capa.jpg',
    );
  });

  it('shows the fallback when the URL is blank', () => {
    render(<CourseCover title="Turismo Rural" imageUrl="   " />);

    expect(
      screen.getByRole('img', { name: /capa indisponível para o curso turismo rural/i }),
    ).toBeInTheDocument();
  });

  it('switches to the fallback after a load error', () => {
    render(<CourseCover title="Turismo Rural" imageUrl="/imagem-inexistente.jpg" />);

    fireEvent.error(screen.getByRole('img', { name: /capa do curso turismo rural/i }));

    expect(
      screen.getByRole('img', { name: /capa indisponível para o curso turismo rural/i }),
    ).toBeInTheDocument();
  });
});
