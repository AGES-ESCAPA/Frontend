import type { FC } from 'react';
import { Button } from '@components/ui';
import styles from './CourseCompletionMessage.module.css';

export interface CourseCompletionMessageProps {
  /** Nome do curso concluído, exibido na mensagem de parabenização. */
  courseTitle: string;
  onViewOtherCourses: () => void;
  onViewCertificate: () => void;
}

/**
 * Mensagem de parabenização exibida no overlay central do player (US-17),
 * no lugar do botão de play, quando o aluno termina a última aula do curso.
 */
export const CourseCompletionMessage: FC<CourseCompletionMessageProps> = ({
  courseTitle,
  onViewOtherCourses,
  onViewCertificate,
}) => {
  return (
    <div className={styles.message} role="status">
      <p className={styles.text}>
        Parabéns, você acaba de concluir o curso
        <br />
        <span className={styles.courseTitle}>{courseTitle}</span>
      </p>
      <div className={styles.actions}>
        <Button label="Ver Outros Cursos" variant="secondary" onClick={onViewOtherCourses} />
        <Button label="Ver Certificado" variant="primary" onClick={onViewCertificate} />
      </div>
    </div>
  );
};
