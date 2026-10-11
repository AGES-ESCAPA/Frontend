import type { FC } from 'react';
import type { CourseSummary } from '@/types/course';
import styles from './CourseInstructor.module.css';

export interface CourseInstructorProps {
  instructor: CourseSummary['instructor'];
}

export const CourseInstructor: FC<CourseInstructorProps> = ({ instructor }) => {
  const initial = instructor.name.trim().charAt(0).toLocaleUpperCase('pt-BR');

  return (
    <section className={styles.section} aria-labelledby="instructor-title">
      <h2 id="instructor-title">Sobre o Instrutor</h2>
      <div className={styles.card}>
        <div className={styles.identity}>
          <span className={styles.avatar}>
            {instructor.avatarUrl ? (
              <img src={instructor.avatarUrl} alt={`Foto de ${instructor.name}`} />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </span>
          <span>
            <strong>{instructor.name}</strong>
            {instructor.role ? <small>{instructor.role}</small> : null}
          </span>
        </div>
        {instructor.bio ? <p className={styles.bio}>{instructor.bio}</p> : null}
      </div>
    </section>
  );
};
