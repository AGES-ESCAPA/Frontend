import { describe, expect, it } from 'vitest';
import type { StudentCurriculum } from '@/types/curriculum';
import { findLessonNeighbors } from './lessonNavigation';

const curriculum: StudentCurriculum = {
  courseId: 'course',
  completedLessons: 0,
  totalLessons: 3,
  modules: [
    {
      id: 'm1',
      title: 'Módulo 1',
      locked: false,
      completedLessons: 0,
      totalLessons: 2,
      lessons: [
        { id: 'a', title: 'Aula A', durationMinutes: 5, status: 'AVAILABLE' },
        { id: 'b', title: 'Aula B', durationMinutes: 5, status: 'LOCKED' },
      ],
    },
    {
      id: 'm2',
      title: 'Módulo 2',
      locked: true,
      completedLessons: 0,
      totalLessons: 1,
      lessons: [{ id: 'c', title: 'Aula C', durationMinutes: 5, status: 'LOCKED' }],
    },
  ],
};

describe('findLessonNeighbors', () => {
  it('should return only the next lesson for the first lesson of the course', () => {
    const { current, previous, next } = findLessonNeighbors(curriculum, 'a');

    expect(current?.id).toBe('a');
    expect(previous).toBeNull();
    expect(next?.id).toBe('b');
  });

  it('should cross module boundaries', () => {
    const { previous, next } = findLessonNeighbors(curriculum, 'b');

    expect(previous?.id).toBe('a');
    expect(next?.id).toBe('c');
  });

  it('should return only the previous lesson for the last lesson of the course', () => {
    const { previous, next } = findLessonNeighbors(curriculum, 'c');

    expect(previous?.id).toBe('b');
    expect(next).toBeNull();
  });

  it('should return nothing when the curriculum is missing or does not contain the lesson', () => {
    expect(findLessonNeighbors(null, 'a')).toEqual({ current: null, previous: null, next: null });
    expect(findLessonNeighbors(curriculum, 'x')).toEqual({
      current: null,
      previous: null,
      next: null,
    });
  });
});
