import { useId, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

import styles from './ReferenceAndExternalLinks.module.css';

export interface LessonReference {
  title: string;
  url: string;
  favicon?: string;
}

export interface LessonReferencesProps {
  references: LessonReference[];
}

interface ReferenceCardProps {
  reference: LessonReference;
}

function ReferenceCard({ reference }: ReferenceCardProps) {
  const { title, url, favicon } = reference;

  const [failedFavicon, setFailedFavicon] = useState<string | null>(null);

  const showFavicon = Boolean(favicon) && failedFavicon !== favicon;

  return (
    <a className={styles.card} href={url} target="_blank" rel="noopener noreferrer">
      <span className={styles.iconSlot}>
        {showFavicon ? (
          <img
            className={styles.favicon}
            src={favicon}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            onError={() => setFailedFavicon(favicon ?? null)}
          />
        ) : (
          <Globe
            className={styles.fallbackIcon}
            size={16}
            aria-hidden="true"
            data-testid="reference-fallback-icon"
          />
        )}
      </span>

      <span className={styles.title}>{title}</span>

      <ExternalLink
        className={styles.externalIcon}
        size={16}
        aria-hidden="true"
        data-testid="reference-external-icon"
      />
    </a>
  );
}

export function LessonReferences({ references }: LessonReferencesProps) {
  const headingId = useId();

  if (!references || references.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Referências e links externos
      </h2>

      <ul className={styles.list}>
        {references.map((reference) => (
          <li key={`${reference.url}-${reference.title}`} className={styles.item}>
            <ReferenceCard reference={reference} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default LessonReferences;
