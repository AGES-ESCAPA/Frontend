import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudentCurriculum } from '@/types/curriculum';
import { getStudentCurriculum, StudentCurriculumError } from '@services/curriculumService';

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

/**
 * Grade de aulas do curso para o menu lateral da Sala de Aula (US-13).
 *
 * Depende só do `courseId`: trocar de aula dentro do mesmo curso não refaz a
 * requisição. A US-15 chama `refetch` depois de concluir uma aula para
 * atualizar status e contadores sem recarregar a página.
 */
export const useStudentCurriculum = (courseId: string): UseStudentCurriculumResult => {
  const [data, setData] = useState<StudentCurriculum | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [error, setError] = useState<StudentCurriculumLoadError | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Um refetch cancela a requisição anterior, para uma resposta antiga não
    // sobrescrever uma mais nova.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const curriculum = await getStudentCurriculum(courseId, controller.signal);
      if (controller.signal.aborted) return;

      setData(curriculum);
    } catch (loadError: unknown) {
      if (controller.signal.aborted) return;

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
  }, [courseId]);

  useEffect(() => {
    setData(null);

    if (!courseId) {
      setIsLoading(false);
      return undefined;
    }

    void load();

    return () => controllerRef.current?.abort();
  }, [courseId, load]);

  const refetch = useCallback(() => {
    if (courseId) {
      void load();
    }
  }, [courseId, load]);

  return { data, isLoading, error, refetch };
};
