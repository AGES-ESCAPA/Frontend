import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerControls, type PlayerControlsProps } from './PlayerControls';

const renderControls = (props: Partial<PlayerControlsProps> = {}) => {
  const onTogglePlay = vi.fn();
  const onSeek = vi.fn();

  render(
    <PlayerControls
      isPlaying={false}
      currentTime={551}
      duration={1450}
      onTogglePlay={onTogglePlay}
      onSeek={onSeek}
      {...props}
    />,
  );

  return { onTogglePlay, onSeek };
};

describe('PlayerControls', () => {
  it('shows the elapsed and total time as "mm:ss / mm:ss"', () => {
    renderControls();

    expect(screen.getByText('09:11 / 24:10')).toBeInTheDocument();
  });

  it('uses "h:mm:ss" for videos longer than one hour', () => {
    renderControls({ currentTime: 3725, duration: 7325 });

    expect(screen.getByText('1:02:05 / 2:02:05')).toBeInTheDocument();
  });

  it('does not render the progress percentage', () => {
    renderControls();

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  describe('play/pause button', () => {
    it('offers "Reproduzir" with the play icon while paused', () => {
      renderControls({ isPlaying: false });

      const button = screen.getByRole('button', { name: 'Reproduzir' });

      expect(button.querySelector('.lucide-play')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument();
    });

    it('offers "Pausar" with the pause icon while playing', () => {
      renderControls({ isPlaying: true });

      const button = screen.getByRole('button', { name: 'Pausar' });

      expect(button.querySelector('.lucide-pause')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reproduzir' })).not.toBeInTheDocument();
    });

    it('calls onTogglePlay when clicked', async () => {
      const { onTogglePlay } = renderControls();

      await userEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));

      expect(onTogglePlay).toHaveBeenCalledOnce();
    });
  });

  describe('timeline', () => {
    it('is a keyboard-accessible range with the current time in seconds', () => {
      renderControls();

      const timeline = screen.getByRole('slider', { name: 'Linha do tempo do vídeo' });

      expect(timeline).toHaveAttribute('type', 'range');
      expect(timeline).toHaveAttribute('min', '0');
      expect(timeline).toHaveAttribute('max', '1450');
      expect(timeline).toHaveValue('551');
      expect(timeline).toHaveAttribute('aria-valuetext', '09:11 de 24:10');
    });

    it('fills the timeline proportionally to the elapsed time', () => {
      renderControls({ currentTime: 725, duration: 1450 });

      const timeline = screen.getByRole('slider');

      expect(timeline.style.getPropertyValue('--progress')).toBe('50%');
    });

    it('calls onSeek with the matching time in seconds when the timeline changes', () => {
      const { onSeek } = renderControls();

      fireEvent.change(screen.getByRole('slider'), { target: { value: '600' } });

      expect(onSeek).toHaveBeenCalledOnce();
      expect(onSeek).toHaveBeenCalledWith(600);
    });

    it('does not call onSeek on render', () => {
      const { onSeek } = renderControls();

      expect(onSeek).not.toHaveBeenCalled();
    });
  });

  describe('invalid times', () => {
    it('shows zeros and an empty timeline while the duration is unknown', () => {
      renderControls({ currentTime: 0, duration: 0 });

      expect(screen.getByText('00:00 / 00:00')).toBeInTheDocument();
      expect(screen.getByRole('slider').style.getPropertyValue('--progress')).toBe('0%');
    });

    it('never fills the timeline beyond 100%', () => {
      renderControls({ currentTime: 2000, duration: 1450 });

      expect(screen.getByRole('slider').style.getPropertyValue('--progress')).toBe('100%');
    });
  });
});
