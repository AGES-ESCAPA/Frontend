import type { ReactNode } from 'react';
import styles from './Table.module.css';

export type TableAlign = 'start' | 'center' | 'end';

export interface TableColumn<T> {
  id: string;
  header: string;
  align?: TableAlign;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /** Texto abaixo da grade, fora do quadro arredondado. */
  footer?: ReactNode;
  emptyMessage?: string;
  caption?: string;
  className?: string;
}

const ALIGN_CLASS: Record<TableAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

export const Table = <T,>({
  columns,
  data,
  getRowId,
  footer,
  emptyMessage = 'Nenhum registro encontrado.',
  caption,
  className = '',
}: TableProps<T>) => {
  const columnCount = columns.length;

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div className={styles.frame}>
        <table className={styles.table} aria-label={caption}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`${styles.headerCell} ${ALIGN_CLASS[column.align ?? 'center']}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={columnCount}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={getRowId(row)} className={styles.row}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`${styles.cell} ${ALIGN_CLASS[column.align ?? 'center']}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
