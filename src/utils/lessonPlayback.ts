const STORAGE_PREFIX = 'escapa:lesson-playback:';

export interface LessonPlaybackState {
  position: number;
  duration: number;
}

export const lessonPlaybackKey = (lessonId: string): string => `${STORAGE_PREFIX}${lessonId}`;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Posição salva da aula, limitada à duração atual do vídeo. Sem registro, 0.
 */
export const resolveLessonPlaybackPosition = (lessonId: string, duration: number): number => {
  if (!lessonId || !isFiniteNumber(duration) || duration <= 0) return 0;

  const saved = readLessonPlayback(lessonId);

  if (!saved) return 0;

  return Math.min(Math.max(saved.position, 0), duration);
};

export const readLessonPlayback = (lessonId: string): LessonPlaybackState | null => {
  if (!lessonId) return null;

  try {
    const raw = localStorage.getItem(lessonPlaybackKey(lessonId));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LessonPlaybackState>;

    if (!isFiniteNumber(parsed.position) || !isFiniteNumber(parsed.duration)) return null;

    return { position: parsed.position, duration: parsed.duration };
  } catch {
    return null;
  }
};

export const writeLessonPlayback = (lessonId: string, state: LessonPlaybackState): void => {
  if (!lessonId || !isFiniteNumber(state.position) || !isFiniteNumber(state.duration)) return;

  try {
    localStorage.setItem(
      lessonPlaybackKey(lessonId),
      JSON.stringify({
        position: Math.max(0, state.position),
        duration: Math.max(0, state.duration),
      }),
    );
  } catch {
    // Quota cheia ou modo privado: o player segue sem persistir.
  }
};
