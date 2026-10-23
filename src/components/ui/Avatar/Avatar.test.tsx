import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

// O Fallback do Radix aparece depois de um efeito, por isso as buscas usam findBy.
describe('Avatar', () => {
  it('shows the initials when there is no image', async () => {
    render(<Avatar name="Maria Silva" />);

    expect(await screen.findByText('MS')).toBeInTheDocument();
  });

  it('uses the small size by default, as in the Navbar and Sidebar', async () => {
    render(<Avatar name="Maria Silva" />);

    const initials = await screen.findByText('MS');
    expect(initials.closest('[data-size]')).toHaveAttribute('data-size', 'sm');
  });

  it('uses the large size for the profile photo', async () => {
    render(<Avatar name="Maria Silva" size="lg" />);

    const initials = await screen.findByText('MS');
    expect(initials.closest('[data-size]')).toHaveAttribute('data-size', 'lg');
  });
});
