import {
  lessonPlaybackKey,
  readLessonPlayback,
  resolveLessonPlaybackPosition,
  writeLessonPlayback,
} from './lessonPlayback';

const LESSON_ID = 'lesson-1';

describe('lessonPlayback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when there is no saved playback', () => {
    expect(readLessonPlayback(LESSON_ID)).toBeNull();
  });

  it('round-trips a saved position', () => {
    writeLessonPlayback(LESSON_ID, { position: 80, duration: 300 });

    expect(localStorage.getItem(lessonPlaybackKey(LESSON_ID))).toContain('80');
    expect(readLessonPlayback(LESSON_ID)).toEqual({ position: 80, duration: 300 });
  });

  it('clamps the restored position to the current duration', () => {
    writeLessonPlayback(LESSON_ID, { position: 280, duration: 300 });

    expect(resolveLessonPlaybackPosition(LESSON_ID, 200)).toBe(200);
    expect(resolveLessonPlaybackPosition(LESSON_ID, 300)).toBe(280);
  });

  it('returns 0 without a lesson, duration or stored value', () => {
    expect(resolveLessonPlaybackPosition('', 300)).toBe(0);
    expect(resolveLessonPlaybackPosition(LESSON_ID, 0)).toBe(0);
    expect(resolveLessonPlaybackPosition(LESSON_ID, 300)).toBe(0);
  });

  it('ignores invalid JSON and non-numeric payloads', () => {
    localStorage.setItem(lessonPlaybackKey(LESSON_ID), '{not json');
    expect(readLessonPlayback(LESSON_ID)).toBeNull();

    localStorage.setItem(lessonPlaybackKey(LESSON_ID), JSON.stringify({ position: 'x' }));
    expect(readLessonPlayback(LESSON_ID)).toBeNull();
  });
});
