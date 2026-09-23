import { fireEvent, render, screen } from '@testing-library/react';
import { LessonVideoPlayer } from './LessonVideoPlayer';

const MP4_URL = 'https://example.com/video.mp4';
const VIMEO_URL = 'https://vimeo.com/123456789';
const TITLE = 'Experiências Imersivas na Prática';

const renderPlayer = (props: Partial<React.ComponentProps<typeof LessonVideoPlayer>> = {}) => {
  const onEnded = vi.fn();

  render(<LessonVideoPlayer src={MP4_URL} title={TITLE} onEnded={onEnded} {...props} />);

  return { onEnded };
};

const loadMetadata = (video: HTMLVideoElement, duration = 1450) => {
  Object.defineProperty(video, 'duration', {
    configurable: true,
    value: duration,
  });

  fireEvent.loadedMetadata(video);
};

const makeVimeoReady = () => {
  fireEvent(
    window,
    new MessageEvent('message', {
      origin: 'https://player.vimeo.com',
      data: {
        event: 'ready',
      },
    }),
  );
};

describe('LessonVideoPlayer', () => {
  describe('MP4 video', () => {
    it('renders the native video', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE);

      expect(video.tagName).toBe('VIDEO');
      expect(video).toHaveAttribute('src', MP4_URL);
    });

    it('shows loading before the metadata is loaded', () => {
      renderPlayer();

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('shows the play overlay after the metadata is loaded', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);

      expect(screen.getByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();

      expect(screen.getByText(TITLE)).toBeInTheDocument();
    });

    it('hides the overlay while the video is playing', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);

      expect(screen.queryByRole('button', { name: 'Reproduzir vídeo' })).not.toBeInTheDocument();
    });

    it('shows the overlay again when the video is paused', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(screen.getByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();
    });

    it('updates the elapsed time when timeupdate is fired', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);

      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        writable: true,
        value: 551,
      });

      fireEvent.timeUpdate(video);

      expect(screen.getByText('09:11 / 24:10')).toBeInTheDocument();
    });

    it('calls onEnded when the video finishes', () => {
      const { onEnded } = renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      fireEvent.ended(video);

      expect(onEnded).toHaveBeenCalledOnce();
    });
  });

  describe('Vimeo', () => {
    it('renders Vimeo URLs using an iframe', () => {
      renderPlayer({ src: VIMEO_URL });

      const iframe = screen.getByTitle(TITLE);

      expect(iframe.tagName).toBe('IFRAME');

      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('https://player.vimeo.com/video/123456789'),
      );
    });

    it('shows loading while Vimeo is not ready', () => {
      renderPlayer({ src: VIMEO_URL });

      expect(screen.getByText('Carregando...')).toBeInTheDocument();

      expect(
        screen.queryByRole('slider', {
          name: 'Linha do tempo do vídeo',
        }),
      ).not.toBeInTheDocument();
    });

    it('shows PlayerControls when Vimeo is ready', () => {
      renderPlayer({ src: VIMEO_URL });

      makeVimeoReady();

      expect(
        screen.getByRole('slider', {
          name: 'Linha do tempo do vídeo',
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {
          name: 'Reproduzir',
        }),
      ).toBeInTheDocument();

      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    it('updates the elapsed time from Vimeo timeupdate events', () => {
      renderPlayer({ src: VIMEO_URL });

      makeVimeoReady();

      fireEvent(
        window,
        new MessageEvent('message', {
          origin: 'https://player.vimeo.com',
          data: {
            event: 'timeupdate',
            data: {
              seconds: 551,
              duration: 1450,
            },
          },
        }),
      );

      expect(screen.getByText('09:11 / 24:10')).toBeInTheDocument();
    });

    it('changes PlayerControls to pause when Vimeo starts playing', () => {
      renderPlayer({ src: VIMEO_URL });

      makeVimeoReady();

      fireEvent(
        window,
        new MessageEvent('message', {
          origin: 'https://player.vimeo.com',
          data: {
            event: 'play',
          },
        }),
      );

      expect(
        screen.getByRole('button', {
          name: 'Pausar',
        }),
      ).toBeInTheDocument();
    });

    it('calls onEnded when Vimeo finishes', () => {
      const { onEnded } = renderPlayer({ src: VIMEO_URL });

      makeVimeoReady();

      fireEvent(
        window,
        new MessageEvent('message', {
          origin: 'https://player.vimeo.com',
          data: {
            event: 'ended',
          },
        }),
      );

      expect(onEnded).toHaveBeenCalledOnce();
    });
  });

  describe('error', () => {
    it('shows "Vídeo indisponível" when the video fails to load', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE);

      fireEvent.error(video);

      expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('plays the video when Space is pressed while the player is focused', () => {
      renderPlayer();

      const player = screen.getByLabelText(`Player da aula ${TITLE}`);

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      const playMock = vi.spyOn(video, 'play').mockResolvedValue(undefined);

      Object.defineProperty(video, 'paused', {
        configurable: true,
        value: true,
      });

      player.focus();

      fireEvent.keyDown(player, {
        code: 'Space',
        key: ' ',
      });

      expect(playMock).toHaveBeenCalledOnce();

      playMock.mockRestore();
    });
  });
});
