import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonVideoPlayer } from './LessonVideoPlayer';

type VimeoHandler = (data?: unknown) => void;

interface FakeVimeoPlayer {
  element: HTMLIFrameElement;
  paused: boolean;
  readyResult: Promise<void>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  setCurrentTime: ReturnType<typeof vi.fn>;
  emit: (event: string, data?: unknown) => void;
}

const vimeo = vi.hoisted(() => ({
  instances: [] as FakeVimeoPlayer[],
  nextReady: null as Promise<void> | null,
}));

vi.mock('@vimeo/player', () => ({
  default: class {
    element: HTMLIFrameElement;
    paused = true;
    readyResult: Promise<void>;
    handlers = new Map<string, Set<VimeoHandler>>();
    play = vi.fn(() => {
      this.paused = false;
      return Promise.resolve();
    });
    pause = vi.fn(() => {
      this.paused = true;
      return Promise.resolve();
    });
    setCurrentTime = vi.fn((seconds: number) => Promise.resolve(seconds));

    constructor(element: HTMLIFrameElement) {
      this.element = element;
      this.readyResult = vimeo.nextReady ?? Promise.resolve();
      vimeo.instances.push(this as unknown as FakeVimeoPlayer);
    }

    ready() {
      return this.readyResult;
    }

    getDuration() {
      return Promise.resolve(300);
    }

    getPaused() {
      return Promise.resolve(this.paused);
    }

    on(event: string, handler: VimeoHandler) {
      if (!this.handlers.has(event)) this.handlers.set(event, new Set());
      this.handlers.get(event)!.add(handler);
    }

    off(event: string, handler: VimeoHandler) {
      this.handlers.get(event)?.delete(handler);
    }

    emit(event: string, data?: unknown) {
      this.handlers.get(event)?.forEach((handler) => handler(data));
    }
  },
}));

const lastVimeoPlayer = () => vimeo.instances[vimeo.instances.length - 1];

beforeEach(() => {
  vimeo.instances = [];
  vimeo.nextReady = null;
});

const MP4_URL = 'https://example.com/video.mp4';
const SECOND_MP4_URL = 'https://example.com/video-2.mp4';
const VIMEO_URL = 'https://vimeo.com/123456789';
const TITLE = 'Experiências Imersivas na Prática';

const renderPlayer = (props: Partial<React.ComponentProps<typeof LessonVideoPlayer>> = {}) => {
  const onEnded = vi.fn();

  const result = render(
    <LessonVideoPlayer src={MP4_URL} title={TITLE} onEnded={onEnded} {...props} />,
  );

  return {
    ...result,
    onEnded,
  };
};

const loadMetadata = (video: HTMLVideoElement, duration = 1450) => {
  Object.defineProperty(video, 'duration', {
    configurable: true,
    value: duration,
  });

  fireEvent.loadedMetadata(video);
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

      expect(
        screen.getByRole('button', {
          name: 'Reproduzir vídeo',
        }),
      ).toBeInTheDocument();

      expect(screen.getByText(TITLE)).toBeInTheDocument();
    });

    it('hides the overlay while the video is playing', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);

      expect(
        screen.queryByRole('button', {
          name: 'Reproduzir vídeo',
        }),
      ).not.toBeInTheDocument();
    });

    it('shows the overlay again when the video is paused', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(
        screen.getByRole('button', {
          name: 'Reproduzir vídeo',
        }),
      ).toBeInTheDocument();
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

    it('does not add the legacy api parameter to the Vimeo URL', () => {
      renderPlayer({ src: VIMEO_URL });

      const iframe = screen.getByTitle(TITLE);

      expect(iframe.getAttribute('src')).not.toContain('api=1');
    });

    it('asks Vimeo to hide its own controls', () => {
      renderPlayer({ src: VIMEO_URL });

      expect(screen.getByTitle(TITLE).getAttribute('src')).toContain('controls=0');
    });

    it('does not show the native video loading state over Vimeo', () => {
      renderPlayer({ src: VIMEO_URL });

      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });

    it('renders the custom PlayerControls once the Vimeo player is ready', async () => {
      renderPlayer({ src: VIMEO_URL });

      expect(lastVimeoPlayer().element).toBe(screen.getByTitle(TITLE));

      expect(
        await screen.findByRole('slider', { name: 'Linha do tempo do vídeo' }),
      ).toBeInTheDocument();
      expect(screen.getByText('00:00 / 05:00')).toBeInTheDocument();
    });

    it('controls the Vimeo video from the play button and the timeline', async () => {
      const user = userEvent.setup();

      renderPlayer({ src: VIMEO_URL });

      await user.click(await screen.findByRole('button', { name: 'Reproduzir vídeo' }));

      expect(lastVimeoPlayer().play).toHaveBeenCalledOnce();

      act(() => {
        lastVimeoPlayer().emit('play');
        lastVimeoPlayer().emit('timeupdate', { seconds: 65, duration: 300, percent: 0.2 });
      });

      expect(screen.getByText('01:05 / 05:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();

      fireEvent.change(screen.getByRole('slider', { name: 'Linha do tempo do vídeo' }), {
        target: { value: '120' },
      });

      expect(lastVimeoPlayer().setCurrentTime).toHaveBeenCalledWith(120);
    });

    it('shows the completion message when the last Vimeo lesson ends', async () => {
      const { onEnded } = renderPlayer({
        src: VIMEO_URL,
        isLastLesson: true,
        courseTitle: 'Curso Vimeo',
      });

      await screen.findByRole('slider', { name: 'Linha do tempo do vídeo' });

      act(() => {
        lastVimeoPlayer().emit('ended');
      });

      expect(onEnded).toHaveBeenCalledOnce();
      expect(screen.getByText('Curso Vimeo')).toBeInTheDocument();
    });

    it('shows "Vídeo indisponível" when the Vimeo player fails to load', async () => {
      vimeo.nextReady = Promise.reject(new Error('private video'));

      renderPlayer({ src: VIMEO_URL });

      expect(await screen.findByText('Vídeo indisponível')).toBeInTheDocument();
    });
  });

  describe('error', () => {
    it('shows "Vídeo indisponível" when the native video fails to load', () => {
      renderPlayer();

      const video = screen.getByLabelText(TITLE);

      fireEvent.error(video);

      expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
    });

    it('resets the error state when src changes', () => {
      const { rerender } = renderPlayer();

      const firstVideo = screen.getByLabelText(TITLE);

      fireEvent.error(firstVideo);

      expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();

      rerender(<LessonVideoPlayer src={SECOND_MP4_URL} title={TITLE} />);

      expect(screen.queryByText('Vídeo indisponível')).not.toBeInTheDocument();

      const secondVideo = screen.getByLabelText(TITLE);

      expect(secondVideo).toHaveAttribute('src', SECOND_MP4_URL);

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  describe('course completion (US-17)', () => {
    const COURSE_TITLE = 'Experiências Imersivas na Prática';

    it('shows the standard overlay when a lesson that is not the last one ends', () => {
      renderPlayer({ isLastLesson: false, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);

      expect(screen.getByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();
      expect(screen.getByText(TITLE)).toBeInTheDocument();
      expect(screen.queryByText(/parabéns/i)).not.toBeInTheDocument();
    });

    it('shows the congrats message with the course name when the last lesson ends', () => {
      renderPlayer({ isLastLesson: true, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);

      expect(screen.getByText(/parabéns/i)).toBeInTheDocument();
      expect(screen.getByText(COURSE_TITLE)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reproduzir vídeo' })).not.toBeInTheDocument();
    });

    it('does not show the congrats message before the video ends, even on the last lesson', () => {
      renderPlayer({ isLastLesson: true, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(screen.getByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();
      expect(screen.queryByText(/parabéns/i)).not.toBeInTheDocument();
    });

    it('offers actions to proceed once the congrats message is shown', async () => {
      const onViewOtherCourses = vi.fn();
      const onViewCertificate = vi.fn();

      renderPlayer({
        isLastLesson: true,
        courseTitle: COURSE_TITLE,
        onViewOtherCourses,
        onViewCertificate,
      });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);

      await userEvent.click(screen.getByRole('button', { name: 'Ver Certificado' }));
      await userEvent.click(screen.getByRole('button', { name: 'Ver Outros Cursos' }));

      expect(onViewCertificate).toHaveBeenCalledOnce();
      expect(onViewOtherCourses).toHaveBeenCalledOnce();
    });

    it('does not toggle the video when Space is pressed on a button inside the message', () => {
      renderPlayer({ isLastLesson: true, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);

      const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);
      Object.defineProperty(video, 'paused', { configurable: true, value: true });

      const certificateButton = screen.getByRole('button', { name: 'Ver Certificado' });
      certificateButton.focus();
      fireEvent.keyDown(certificateButton, { code: 'Space', key: ' ' });

      // O Espaço com foco no botão deve ativar só o botão (comportamento nativo do
      // <button>), sem o player interpretar como "tocar/pausar o vídeo".
      expect(playSpy).not.toHaveBeenCalled();

      playSpy.mockRestore();
    });

    it('clears the congrats message when playing the video again after it ended', () => {
      renderPlayer({ isLastLesson: true, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);
      expect(screen.getByText(/parabéns/i)).toBeInTheDocument();

      // Reassistir a aula (ex.: pausar no meio pra rever um trecho) não pode
      // trazer de volta a mensagem de conclusão de antes.
      fireEvent.play(video);
      fireEvent.pause(video);

      expect(screen.getByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();
      expect(screen.getByText(TITLE)).toBeInTheDocument();
      expect(screen.queryByText(/parabéns/i)).not.toBeInTheDocument();
    });

    it('clears the congrats message when moving to another lesson', () => {
      const { rerender } = renderPlayer({ isLastLesson: true, courseTitle: COURSE_TITLE });

      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;

      loadMetadata(video);
      fireEvent.play(video);
      fireEvent.ended(video);

      expect(screen.getByText(/parabéns/i)).toBeInTheDocument();

      rerender(
        <LessonVideoPlayer
          src={SECOND_MP4_URL}
          title={TITLE}
          courseTitle={COURSE_TITLE}
          isLastLesson={false}
        />,
      );

      expect(screen.queryByText(/parabéns/i)).not.toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('plays the native video when Space is pressed while the player is focused', () => {
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

    it('plays the Vimeo video when Space is pressed while the player is focused', async () => {
      renderPlayer({ src: VIMEO_URL });

      await screen.findByRole('slider', { name: 'Linha do tempo do vídeo' });

      const player = screen.getByLabelText(`Player da aula ${TITLE}`);

      player.focus();

      const notPrevented = fireEvent.keyDown(player, { code: 'Space', key: ' ' });

      expect(notPrevented).toBe(false);
      await vi.waitFor(() => expect(lastVimeoPlayer().play).toHaveBeenCalledOnce());
    });

    it('intercepts Space on the native video so the page does not scroll', () => {
      renderPlayer();

      const player = screen.getByLabelText(`Player da aula ${TITLE}`);
      const video = screen.getByLabelText(TITLE) as HTMLVideoElement;
      vi.spyOn(video, 'play').mockResolvedValue(undefined);
      Object.defineProperty(video, 'paused', { configurable: true, value: true });

      const notPrevented = fireEvent.keyDown(player, { code: 'Space', key: ' ' });

      expect(notPrevented).toBe(false);
    });
  });

  describe('lesson actions', () => {
    const actions = {
      previousAction: <button type="button">Anterior</button>,
      nextAction: <button type="button">Próxima</button>,
      controlsAction: <button type="button">Concluir</button>,
    };

    it('renders the side actions over the video', () => {
      renderPlayer(actions);

      expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Próxima' })).toBeInTheDocument();
    });

    it('renders the controls action inside the controls bar once the video loads', () => {
      renderPlayer(actions);

      expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();

      loadMetadata(screen.getByLabelText(TITLE) as HTMLVideoElement);

      const timeline = screen.getByRole('slider', { name: 'Linha do tempo do vídeo' });

      expect(timeline.parentElement).toContainElement(
        screen.getByRole('button', { name: 'Concluir' }),
      );
    });

    it('shows the unavailable state with every action when the lesson has no video URL', () => {
      renderPlayer({ ...actions, src: '' });

      expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(TITLE)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Próxima' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
    });

    it('keeps the controls action available when the video fails', () => {
      renderPlayer(actions);

      fireEvent.error(screen.getByLabelText(TITLE));

      expect(screen.getByText('Vídeo indisponível')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
    });
  });
});
