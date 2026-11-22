import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import styles from './Table.module.css';

const MOBILE_MEDIA_QUERY = '(max-width: 47.999rem)';

const matchesMobile = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
    : false;

export type TableAlign = 'start' | 'center' | 'end';

/** Papel da coluna no layout responsivo. */
export type TableColumnRole = 'primary' | 'field' | 'actions';

export interface TableColumn<T> {
  id: string;
  header: string;
  align?: TableAlign;
  render: (row: T) => ReactNode;
  /**
   * `primary` = título do card no mobile; `actions` = sticky / rodapé do card;
   * `field` = pares rótulo/valor. Sem valor, infere pela posição e pelo id/header.
   */
  role?: TableColumnRole;
  /**
   * Visível na tabela de tablet (768–1023px). Primary e actions entram sempre.
   * Sem valor, os primeiros campos (até completar ~4 colunas) são essenciais.
   */
  essential?: boolean;
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

type ResolvedColumn<T> = TableColumn<T> & {
  role: TableColumnRole;
  essential: boolean;
};

const ALIGN_CLASS: Record<TableAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

const isActionsColumn = <T,>(column: TableColumn<T>): boolean =>
  column.role === 'actions' ||
  column.id === 'actions' ||
  /^a[cç][oõ]es$/i.test(column.header.trim());

const resolveColumns = <T,>(columns: TableColumn<T>[]): ResolvedColumn<T>[] => {
  const explicitPrimary = columns.findIndex((column) => column.role === 'primary');
  const fallbackPrimary = columns.findIndex((column) => !isActionsColumn(column));
  const primaryIndex = explicitPrimary >= 0 ? explicitPrimary : fallbackPrimary;

  const withRoles = columns.map((column, index) => {
    const actions = isActionsColumn(column);
    const primary = !actions && index === primaryIndex;

    return {
      ...column,
      role: (column.role ??
        (actions ? 'actions' : primary ? 'primary' : 'field')) as TableColumnRole,
    };
  });

  const fieldCount = withRoles.filter((column) => column.role === 'field').length;
  const hasActions = withRoles.some((column) => column.role === 'actions');
  // Curtas: tudo essencial. Com ações: primary + 2 fields + actions. Sem ações: até 4 fields.
  const maxEssentialFields =
    fieldCount <= 3 ? fieldCount : hasActions ? 2 : Math.min(fieldCount, 4);

  let essentialFields = 0;
  return withRoles.map((column): ResolvedColumn<T> => {
    if (column.role === 'primary' || column.role === 'actions') {
      return { ...column, essential: column.essential ?? true };
    }

    if (column.essential !== undefined) {
      return { ...column, essential: column.essential };
    }

    const include = essentialFields < maxEssentialFields;
    if (include) essentialFields += 1;
    return { ...column, essential: include };
  });
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
  const resolved = useMemo(() => resolveColumns(columns), [columns]);
  const primary = resolved.find((column) => column.role === 'primary') ?? resolved[0];
  const actions = resolved.find((column) => column.role === 'actions');
  const fields = resolved.filter((column) => column.role === 'field');
  const essentialFields = fields.filter((column) => column.essential);
  const nonEssentialFields = fields.filter((column) => !column.essential);
  // Card mobile: até 3 campos de apoio (essenciais primeiro).
  const cardFields = [...essentialFields, ...nonEssentialFields].slice(0, 3);
  const cardFieldIds = new Set(cardFields.map((column) => column.id));
  const secondaryFields = fields.filter((column) => !cardFieldIds.has(column.id));
  // No tablet, “Mais detalhes” cobre o que não é essencial (mesmo que já caiba no card).
  const tabletSecondaryFields = nonEssentialFields;
  const hasSecondary = tabletSecondaryFields.length > 0;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [isMobile, setIsMobile] = useState(matchesMobile);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const toggleExpanded = (rowId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const tableColumns: ResolvedColumn<T>[] = hasSecondary
    ? [
        ...resolved.filter((column) => column.role !== 'actions'),
        {
          id: '__details',
          header: 'Detalhes',
          role: 'field',
          essential: true,
          align: 'center',
          render: (row: T) => {
            const rowId = getRowId(row);
            const open = expandedIds.has(rowId);
            return (
              <button
                type="button"
                className={styles.moreButton}
                aria-expanded={open}
                onClick={() => toggleExpanded(rowId)}
              >
                {open ? 'Ocultar' : 'Mais detalhes'}
              </button>
            );
          },
        },
        ...(actions ? [actions] : []),
      ]
    : resolved;

  const columnCount = tableColumns.length;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-layout={isMobile ? 'cards' : 'table'}
    >
      {isMobile ? (
        <ul className={styles.cardList} aria-label={caption}>
          {data.length === 0 ? (
            <li className={styles.cardEmpty}>{emptyMessage}</li>
          ) : (
            data.map((row) => {
              const rowId = getRowId(row);
              return (
                <li key={rowId} className={styles.card}>
                  {primary ? <div className={styles.cardTitle}>{primary.render(row)}</div> : null}

                  {cardFields.length > 0 ? (
                    <dl className={styles.cardFields}>
                      {cardFields.map((column) => (
                        <div key={column.id} className={styles.cardField}>
                          <dt className={styles.cardLabel}>{column.header}</dt>
                          <dd className={styles.cardValue}>{column.render(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {secondaryFields.length > 0 ? (
                    <details className={styles.cardMore}>
                      <summary>Mais detalhes</summary>
                      <dl className={styles.cardFields}>
                        {secondaryFields.map((column) => (
                          <div key={column.id} className={styles.cardField}>
                            <dt className={styles.cardLabel}>{column.header}</dt>
                            <dd className={styles.cardValue}>{column.render(row)}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ) : null}

                  {actions ? <div className={styles.cardActions}>{actions.render(row)}</div> : null}
                </li>
              );
            })
          )}
        </ul>
      ) : (
        <div className={styles.frame}>
          <table className={styles.table} aria-label={caption}>
            <thead>
              <tr>
                {tableColumns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    data-role={column.role}
                    data-essential={column.essential ? 'true' : 'false'}
                    data-column-id={column.id}
                    className={`${styles.headerCell} ${ALIGN_CLASS[column.align ?? 'center']} ${
                      column.id === '__details' ? styles.detailsHeader : ''
                    }`}
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
                data.map((row) => {
                  const rowId = getRowId(row);
                  const expanded = expandedIds.has(rowId);

                  return (
                    <Fragment key={rowId}>
                      <tr className={styles.row}>
                        {tableColumns.map((column) => (
                          <td
                            key={column.id}
                            data-role={column.role}
                            data-essential={column.essential ? 'true' : 'false'}
                            data-column-id={column.id}
                            className={`${styles.cell} ${ALIGN_CLASS[column.align ?? 'center']} ${
                              column.id === '__details' ? styles.detailsCell : ''
                            }`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {hasSecondary && expanded ? (
                        <tr className={styles.detailsRow}>
                          <td className={styles.detailsPanel} colSpan={columnCount}>
                            <dl className={styles.cardFields}>
                              {tabletSecondaryFields.map((column) => (
                                <div key={column.id} className={styles.cardField}>
                                  <dt className={styles.cardLabel}>{column.header}</dt>
                                  <dd className={styles.cardValue}>{column.render(row)}</dd>
                                </div>
                              ))}
                            </dl>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
