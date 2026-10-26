import { useEffect, useState } from 'react';
import { loadOwnedCourseIds } from '@utils/ownedCourses';
import type { LoadStatus } from './usePublicCourses';

export interface UseCourseOwnershipResult {
  owned: boolean;
  status: LoadStatus;
}

/**
 * Diz se o aluno logado já adquiriu o curso. Com `enabled` falso (visitante, empresa, admin) não
 * consulta nada. Se a consulta falhar, trata como não adquirido: a compra repetida ainda é barrada
 * pelo 409 do checkout.
 */
export const useCourseOwnership = (
  courseId: string,
  enabled: boolean,
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

    loadOwnedCourseIds()
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
  }, [courseId, enabled]);

  return { owned, status };
};
