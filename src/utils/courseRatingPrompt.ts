/** Evita reabrir o pop-up de avaliação na mesma sessão após o aluno adiar. */
const skippedKey = (courseId: string) => `course-rating-skipped:${courseId}`;

export const wasCourseRatingSkipped = (courseId: string): boolean => {
  try {
    return sessionStorage.getItem(skippedKey(courseId)) === '1';
  } catch {
    return false;
  }
};

export const markCourseRatingSkipped = (courseId: string): void => {
  try {
    sessionStorage.setItem(skippedKey(courseId), '1');
  } catch {
    // sessionStorage pode falhar em modo privado — o card em Concluídos cobre o caso.
  }
};

export const clearCourseRatingSkipped = (courseId: string): void => {
  try {
    sessionStorage.removeItem(skippedKey(courseId));
  } catch {
    // ignore
  }
};
