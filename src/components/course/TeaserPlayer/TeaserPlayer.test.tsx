import { fireEvent, render, screen } from '@testing-library/react';
import { TeaserPlayer } from './TeaserPlayer';

describe('TeaserPlayer', () => {
  it('renders a native video player with controls', () => {
    render(<TeaserPlayer src="/teaser.mp4" title="IA Aplicada ao Turismo" />);
    expect(screen.getByLabelText('Teaser do curso IA Aplicada ao Turismo')).toHaveAttribute(
      'controls',
    );
  });

  it('shows an unavailable message when the teaser is missing', () => {
    render(<TeaserPlayer title="IA Aplicada ao Turismo" />);

    expect(screen.getByRole('status')).toHaveTextContent('Vídeo não disponível para esse curso');
    expect(screen.queryByLabelText(/teaser do curso/i)).not.toBeInTheDocument();
  });

  it('shows an unavailable message when the video fails to load', () => {
    render(<TeaserPlayer src="/teaser.mp4" title="IA Aplicada ao Turismo" />);

    fireEvent.error(screen.getByLabelText('Teaser do curso IA Aplicada ao Turismo'));

    expect(screen.getByRole('status')).toHaveTextContent('Vídeo não disponível para esse curso');
  });
});
