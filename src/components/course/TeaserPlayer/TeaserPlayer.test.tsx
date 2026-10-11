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

  it('embeds a Vimeo player when the teaser is a Vimeo URL', () => {
    render(
      <TeaserPlayer
        src="https://vimeo.com/1226382615?share=copy&fl=sv&fe=ci"
        title="IA Aplicada ao Turismo"
      />,
    );

    const iframe = screen.getByTitle('Teaser do curso IA Aplicada ao Turismo');

    expect(iframe).toHaveAttribute(
      'src',
      'https://player.vimeo.com/video/1226382615?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0',
    );
    expect(iframe).toHaveAttribute(
      'allow',
      'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share',
    );
    expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  });
});
