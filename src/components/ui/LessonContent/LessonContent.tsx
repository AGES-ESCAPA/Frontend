import styles from './LessonContent.module.css';

interface LessonContentProps {
  description?: string | null;
  concepts?: string[] | null;
  isLoading?: boolean;
}

export function LessonContent({ description, concepts, isLoading = false }: LessonContentProps) {
  if (isLoading) {
    return (
      <div className={styles.container} aria-busy="true" data-testid="lesson-content-skeleton">
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLineShort}`} />
        <div className={styles.skeletonTags}>
          <div className={`${styles.skeleton} ${styles.skeletonTag}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTag}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTag}`} />
        </div>
      </div>
    );
  }
  const paragraphs = (description ?? '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const validConcepts = (concepts ?? []).filter((c) => c?.trim());

  const hasDescription = paragraphs.length > 0;
  const hasConcepts = validConcepts.length > 0;

  if (!hasDescription && !hasConcepts) return null;

  return (
    <div className={styles.container}>
      <p className={styles.sectionTitle}>Sobre esta aula</p>

      {hasDescription && (
        <div className={styles.description}>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {hasConcepts && (
        <div className={styles.conceptsWrapper}>
          <span className={styles.conceptsLabel}>Conceitos abordados</span>
          <ul className={styles.tags}>
            {validConcepts.map((concept) => (
              <li key={concept} className={styles.tag}>
                {concept}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
