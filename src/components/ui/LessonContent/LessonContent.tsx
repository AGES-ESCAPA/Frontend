import styles from './LessonContent.module.css';

interface LessonContentProps {
  description: string;
  concepts: string[];
}

export function LessonContent({ description, concepts }: LessonContentProps) {
  return (
    <div className={styles.container}>
      <p className={styles.sectionTitle}>Sobre esta aula</p>

      <div className={styles.description}>
        {description.split('\n').map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>

      {concepts.length > 0 && (
        <p className={styles.concepts}>
          <span className={styles.conceptsLabel}>Conceitos abordados: </span>
          {concepts.join(', ')}.
        </p>
      )}
    </div>
  );
}
