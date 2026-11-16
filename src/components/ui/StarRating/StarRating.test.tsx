import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('shows a read-only rating for accessibility', () => {
    render(<StarRating value={4} label="Sua avaliação" />);

    expect(screen.getByRole('img', { name: 'Sua avaliação: 4 de 5' })).toBeInTheDocument();
  });

  it('lets the student pick a star when interactive', async () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} label="Nota do curso" />);

    await userEvent.click(screen.getByRole('radio', { name: '5 estrelas' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
