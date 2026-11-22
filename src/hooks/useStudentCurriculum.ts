import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudentCurriculum } from '@/types/curriculum';
import { getStudentCurriculum, StudentCurriculumError } from '@services/curriculumService';
import { isNetworkError, isTransientServiceError } from '@services/networkResilience';
import { getCachedResource, resourceCacheKeys, setCachedResource } from '@services/resourceCache';
import { useNetworkRecovery } from '@contexts/useConnectivity';

export interface StudentCurriculumLoadError {
  /** Status HTTP da resposta; `null` em falha de rede. */
  status: number | null;
  message: string;
}

export interface UseStudentCurriculumResult {
  data: StudentCurriculum | null;
  /** `true` enquanto uma requisição está em andamento, inclusive durante o `refetch`. */
  isLoading: boolean;
  error: StudentCurriculumLoadError | null;
  /** Recarrega a grade mantendo os dados atuais visíveis até a resposta chegar. */
  refetch: () => void;
}

const NETWORK_ERROR_MESSAGE = 'Não foi possível carregar o conteúdo do curso.';

const readCache = (courseId: string): StudentCurriculum | null =>
  courseId
    ? getCachedResource<StudentCurriculum>(resourceCacheKeys.studentCurriculum(courseId))
    : null;

/**
 * Grade de aulas do curso para o menu lateral da Sala de Aula (US-13).
 *
 * Depende só do `courseId`: trocar de aula dentro do mesmo curso não refaz a
 * requisição. A US-15 chama `refetch` depois de concluir uma aula para
 * atualizar status e contadores sem recarregar a página.
 *
 * Online-first com cache de sessão: dados recentes aparecem na hora e falhas
 * transitórias de rede não apagam a grade já carregada.
 */
export const useStudentCurriculum = (courseId: string): UseStudentCurriculumResult => {
  const [data, setData] = useState<StudentCurriculum | null>(() => readCache(courseId));
  const [isLoading, setIsLoading] = useState(() => Boolean(courseId) && !readCache(courseId));
  const [error, setError] = useState<StudentCurriculumLoadError | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const load = useCallback(
    async (silent = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const curriculum = await getStudentCurriculum(courseId, controller.signal);
        if (controller.signal.aborted) return;

        setCachedResource(resourceCacheKeys.studentCurriculum(courseId), curriculum);
        setData(curriculum);
        setError(null);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;

        const hasStale = dataRef.current !== null;
        const transient =
          isNetworkError(loadError) ||
          isTransientServiceError(loadError) ||
          (loadError instanceof StudentCurriculumError &&
            (loadError.status === 0 || loadError.status >= 500));

        // Com dados em tela/cache, micro-instabilidade não vira tela de erro.
        if (hasStale && transient) {
          setError(null);
          return;
        }

        setError(
          loadError instanceof StudentCurriculumError
            ? { status: loadError.status, message: loadError.message }
            : { status: null, message: NETWORK_ERROR_MESSAGE },
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [courseId],
  );

  useEffect(() => {
    const cached = readCache(courseId);
    dataRef.current = cached;
    setData(cached);
    setError(null);

    if (!courseId) {
      setIsLoading(false);
      return undefined;
    }

    void load(Boolean(cached));

    return () => controllerRef.current?.abort();
  }, [courseId, load]);

  useNetworkRecovery(() => {
    if (courseId) void load(true);
  });

  const refetch = useCallback(() => {
    if (courseId) {
      void load(false);
    }
  }, [courseId, load]);

  return { data, isLoading, error, refetch };
};
