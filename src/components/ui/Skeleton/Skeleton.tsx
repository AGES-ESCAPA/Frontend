import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton = ({ className = '', width, height }: SkeletonProps) => {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;

  return (
    <span
      className={`${styles.bone} ${className}`.trim()}
      style={style}
      data-skeleton=""
      aria-hidden="true"
    />
  );
};

/** Valor numérico de um cartão de resumo enquanto os dados chegam. */
export const StatSkeleton = () => <Skeleton className={styles.stat} />;

/** Trecho curto para encaixar no meio de uma frase. */
export const InlineSkeleton = () => <Skeleton className={styles.inline} />;

export const PageSkeleton = ({ label }: { label: string }) => (
  <div className={styles.page} role="status" aria-busy="true" aria-label={label}>
    <div className={styles.pageCard} aria-hidden="true">
      <Skeleton className={styles.title} />
      <Skeleton className={styles.line} />
      <Skeleton className={styles.lineShort} />
      <Skeleton className={styles.block} />
    </div>
  </div>
);

export const ListSkeleton = ({
  label,
  rows = 4,
  className = '',
}: {
  label: string;
  rows?: number;
  className?: string;
}) => (
  <div
    className={`${styles.stack} ${className}`.trim()}
    role="status"
    aria-busy="true"
    aria-label={label}
  >
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} className={index === rows - 1 ? styles.lineShort : styles.line} />
    ))}
  </div>
);

export const FieldsSkeleton = ({ label, rows = 6 }: { label: string; rows?: number }) => (
  <div className={styles.stack} role="status" aria-busy="true" aria-label={label}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className={styles.field} aria-hidden="true">
        <Skeleton className={styles.fieldLabel} />
        <Skeleton className={styles.fieldValue} />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({
  label,
  rows = 6,
  columns = 5,
}: {
  label: string;
  rows?: number;
  columns?: number;
}) => (
  <div
    className={styles.table}
    role="status"
    aria-busy="true"
    aria-label={label}
    style={{ '--skeleton-columns': columns } as CSSProperties}
  >
    <div className={styles.tableHeader} aria-hidden="true">
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton key={index} className={styles.headerBone} />
      ))}
    </div>
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className={styles.tableRow} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className={styles.cellBone} />
        ))}
      </div>
    ))}
  </div>
);
