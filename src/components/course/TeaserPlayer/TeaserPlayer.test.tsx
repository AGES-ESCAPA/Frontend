import { render, screen } from '@testing-library/react';
import { TeaserPlayer } from './TeaserPlayer';

describe('TeaserPlayer', () => {
  it('renders a native video player with controls', () => {
    render(<TeaserPlayer src="/teaser.mp4" title="IA Aplicada ao Turismo" />);
    expect(screen.getByLabelText('Teaser do curso IA Aplicada ao Turismo')).toHaveAttribute(
      'controls',
    );
  });
});
