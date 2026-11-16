import { useEffect, useState } from 'react';
import { loadCompanyOwnedCourseIds, loadOwnedCourseIds } from '@utils/ownedCourses';
import type { LoadStatus } from './usePublicCourses';

export type OwnershipSource = 'student' | 'company';

export interface UseCourseOwnershipResult {
  owned: boolean;
  status: LoadStatus;
}

/**
 * Diz se o aluno logado (ou a empresa, com `source` 'company') já adquiriu o curso. Com
 * `enabled` falso (visitante, admin) não
 * consulta nada. Se a consulta falhar, trata como não adquirido: a compra repetida ainda é barrada
 * pelo 409 do checkout.
 */
export const useCourseOwnership = (
  courseId: string,
  enabled: boolean,
  source: OwnershipSource = 'student',
): UseCourseOwnershipResult => {
  const [owned, setOwned] = useState(false);
  const [status, setStatus] = useState<LoadStatus>(enabled ? 'loading' : 'success');

  useEffect(() => {
    if (!enabled || !courseId) {
      setOwned(false);
      setStatus('success');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');

    const loadIds = source === 'company' ? loadCompanyOwnedCourseIds : loadOwnedCourseIds;

    loadIds()
      .then((ids) => {
        if (cancelled) return;
        setOwned(ids.has(courseId));
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setOwned(false);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, enabled, source]);

  return { owned, status };
};
