import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button, CourseRatingModal } from '@components/ui';
import { VideoPlayer } from '@components/course/VideoPlayer/VideoPlayer';
import { NavigationButton } from '@components/course/NavigationButton/NavigationButton';
import { completeStudentLesson, StudentCurriculumError } from '@services/curriculumService';
import { getStudentEnrollments } from '@services/enrollmentService';
import { findLessonNeighbors } from '@/utils/lessonNavigation';
import { getCourseAccessPath, getFirstAccessibleLessonId } from '@/utils/courseAccess';
import {
  clearCourseRatingSkipped,
  markCourseRatingSkipped,
  wasCourseRatingSkipped,
} from '@/utils/courseRatingPrompt';
import { AuthenticatedLayout } from '@components/layout/AuthenticatedLayout/AuthenticatedLayout';
import { SIDEBAR_MENU_PRESETS } from '@components/layout/Sidebar/sidebarMenuPresets';
import { useStudentCurriculum } from '@/hooks/useStudentCurriculum';
import { useStudentLesson } from '@/hooks/useStudentLesson';
import { mockUser } from '@pages/MyCourses/mockCourses';
import { LessonMenu } from './components/LessonMenu';
import { LessonQuizPlayer } from './components/LessonQuizPlayer';
import styles from './CoursePlayer.module.css';
import { LessonContent } from '@components/ui/LessonContent/LessonContent';
import { LessonReferences } from '@components/ui/ReferenceAndExternalLinks/ReferenceAndExternalLinks';

export const CoursePlayer = () => {
  const { courseId = '', lessonId = '' } = useParams<{
    courseId: string;
    lessonId: string;
  }>();

  const navigate = useNavigate();
  const { lesson, status, errorStatus, errorMessage, retry } = useStudentLesson(courseId, lessonId);
  const curriculum = useStudentCurriculum(courseId);

  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  // Conclusões desta sessão, para o overlay não esperar o refetch da grade ao voltar.
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => new Set());
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const [isRedirectingLocked, setIsRedirectingLocked] = useState(false);
  /** null enquanto a matrícula não carrega — evita flash do CTA de compra. */
  const [ownsCourse, setOwnsCourse] = useState<boolean | null>(null);

  useEffect(() => {
    setCompleteError(null);
    setIsRedirectingLocked(false);
  }, [lessonId]);

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    setOwnsCourse(null);

    const loadEnrollmentMeta = async () => {
      try {
        const result = await getStudentEnrollments({ size: 100 });
        if (cancelled) return;
        const card = result.content.find((item) => item.courseId === courseId);
        if (card) {
          setOwnsCourse(true);
          setCourseTitle(card.title);
          setCertificateCode(card.certificateCode ?? null);
        } else {
          setOwnsCourse(false);
        }
      } catch {
        if (!cancelled) setOwnsCourse(false);
        // Título e certificado são opcionais para o fluxo de avaliação.
      }
    };

    void loadEnrollmentMeta();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const courseDetailsPath = `/cursos/${courseId}`;

  const buildLessonHref = (targetLessonId: string) =>
    `/aluno/cursos/${courseId}/aulas/${targetLessonId}`;

  const neighbors = findLessonNeighbors(curriculum.data, lessonId);
  const currentLessonStatus = neighbors.current?.status;
  const previousLesson = neighbors.previous;
  // Antes de concluir a aula atual, a próxima pode vir bloqueada pela progressão sequencial.
  const navigableNext = neighbors.next?.status === 'LOCKED' ? null : neighbors.next;
  const isLastLesson = neighbors.current != null && neighbors.next === null;

  const goToLesson = (targetLessonId: string) => navigate(buildLessonHref(targetLessonId));

  // URL colada de aula LOCKED: manda para a primeira liberada (mesma regra de entrada no curso).
  useEffect(() => {
    if (!courseId || !lessonId || !curriculum.data || curriculum.isLoading) return;
    if (currentLessonStatus !== 'LOCKED') return;

    const accessibleId = getFirstAccessibleLessonId(curriculum.data);
    if (!accessibleId || accessibleId === lessonId) return;

    setIsRedirectingLocked(true);
    navigate(`/aluno/cursos/${courseId}/aulas/${accessibleId}`, { replace: true });
  }, [courseId, lessonId, curriculum.data, curriculum.isLoading, currentLessonStatus, navigate]);

  // 403 do servidor (ex.: progressão sequencial): tenta a primeira aula liberada.
  useEffect(() => {
    if (!courseId || status !== 'error' || errorStatus !== 403) return;

    let cancelled = false;
    const currentLessonPath = `/aluno/cursos/${courseId}/aulas/${lessonId}`;

    const redirectFromForbidden = async () => {
      setIsRedirectingLocked(true);
      const path = await getCourseAccessPath(courseId);
      if (cancelled) return;

      const lessonPathPrefix = `/aluno/cursos/${courseId}/aulas/`;
      if (path.startsWith(lessonPathPrefix) && path !== currentLessonPath) {
        navigate(path, { replace: true });
        return;
      }

      setIsRedirectingLocked(false);
    };

    void redirectFromForbidden();

    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId, status, errorStatus, navigate]);

  const promptCourseRating = useCallback(async () => {
    if (!courseId || wasCourseRatingSkipped(courseId)) return;

    try {
      const result = await getStudentEnrollments({ status: 'COMPLETED', size: 100 });
      const card = result.content.find((item) => item.courseId === courseId);
      if (card?.title) setCourseTitle(card.title);
      if (card?.certificateCode) setCertificateCode(card.certificateCode);
      if (card?.myRating != null) return;
    } catch {
      // Sem matrículas, ainda abrimos o modal; a API rejeita se não concluído.
    }

    setIsRatingOpen(true);
  }, [courseId]);

  const handleCompleteLesson = async () => {
    setIsCompleting(true);
    setCompleteError(null);

    const alreadyCompletedInCurriculum = neighbors.current?.status === 'COMPLETED';
    const totalLessons = curriculum.data?.totalLessons ?? 0;
    const completedBefore = curriculum.data?.completedLessons ?? 0;
    const completedAfter = completedBefore + (alreadyCompletedInCurriculum ? 0 : 1);
    const courseJustCompleted = totalLessons > 0 && completedAfter >= totalLessons;

    try {
      await completeStudentLesson(courseId, lessonId);
      setCompletedLessonIds((current) => new Set(current).add(lessonId));
      curriculum.refetch();

      // Aula grátis sem compra confirmada: fica na aula para o CTA de compra.
      if (lesson?.isFreeSample && ownsCourse !== true) {
        return;
      }

      if (courseJustCompleted) {
        await promptCourseRating();
        return;
      }

      if (neighbors.next) {
        goToLesson(neighbors.next.id);
      }
    } catch (error: unknown) {
      setCompleteError(
        error instanceof StudentCurriculumError
          ? error.message
          : 'Não foi possível concluir a aula.',
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleVideoEnded = () => {
    if (!isLastLesson) return;
    void (async () => {
      const alreadyCompleted =
        neighbors.current?.status === 'COMPLETED' ||
        completedLessonIds.has(lessonId) ||
        (lesson != null && completedLessonIds.has(lesson.id));

      if (!alreadyCompleted) {
        await handleCompleteLesson();
        return;
      }

      await promptCourseRating();
    })();
  };

  // US-13: fica na mesma posição do layout enquanto a aula carrega e depois de
  // carregada, para o menu não ser remontado (nem perder os módulos abertos) ao
  // trocar de aula.
  const lessonMenu = (
    <aside className={styles.sidebarColumn} data-area="Menu lateral" aria-label="Menu lateral">
      <LessonMenu
        data={curriculum.data}
        isLoading={curriculum.isLoading}
        error={curriculum.error}
        onRetry={curriculum.refetch}
        currentLessonId={lessonId}
        buildLessonHref={buildLessonHref}
      />
    </aside>
  );

  const renderLoadingLesson = () => (
    <section className={styles.lesson}>
      <div className={styles.layout}>
        <div className={styles.playerContainer}>
          <div className={`${styles.skeleton} ${styles.playerSkeleton}`} aria-hidden="true" />
        </div>

        <div className={styles.mainColumn} aria-busy="true" aria-label="Carregando aula">
          <header className={styles.header}>
            <div className={`${styles.skeleton} ${styles.skeletonBreadcrumb}`} />
            <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          </header>

          <LessonContent isLoading />
          <LessonReferences isLoading />
        </div>

        {lessonMenu}
      </div>
    </section>
  );

  const renderContent = () => {
    if (isRedirectingLocked || currentLessonStatus === 'LOCKED') {
      return renderLoadingLesson();
    }

    if (status === 'loading') {
      return renderLoadingLesson();
    }

    if (status === 'error' && errorStatus === 403) {
      return (
        <section className={styles.stateContainer}>
          <h1>Acesso à aula indisponível</h1>

          <p>{errorMessage ?? 'Você não possui acesso a esta aula.'}</p>

          <Link className={styles.courseLink} to={courseDetailsPath}>
            Ver detalhes do curso
          </Link>
        </section>
      );
    }

    if (status === 'error' && errorStatus === 404) {
      return (
        <section className={styles.stateContainer}>
          <h1>Aula não encontrada</h1>

          <p>Não foi possível encontrar a aula solicitada.</p>

          <Link className={styles.courseLink} to={courseDetailsPath}>
            Voltar para o curso
          </Link>
        </section>
      );
    }

    if (status === 'error') {
      return (
        <section className={styles.stateContainer}>
          <h1>Não foi possível carregar a aula</h1>

          <p>{errorMessage ?? 'Ocorreu um erro ao carregar a aula.'}</p>

          <Button label="Tentar novamente" variant="outlined" onClick={retry} />
        </section>
      );
    }

    if (!lesson) {
      return null;
    }

    const moduleNumber = lesson.module?.order;
    const lessonNumber = lesson.order;
    const durationMinutes =
      lesson.durationInSeconds != null ? Math.round(lesson.durationInSeconds / 60) : null;

    const lessonMetadata = [
      moduleNumber != null ? `MÓDULO ${moduleNumber}` : null,
      lessonNumber != null ? `AULA ${lessonNumber}` : null,
      durationMinutes != null ? `${durationMinutes} min` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const isQuizLesson = lesson.type === 'quiz';
    // Aulas de texto e de arquivo não têm player: o conteúdo é o texto da aula.
    const isReadingLesson = lesson.type !== 'video' && !isQuizLesson;
    const readingText = lesson.type === 'text' ? lesson.textContent : lesson.description;
    // Parágrafos separados por linha em branco; quebras simples são mantidas no CSS.
    const textParagraphs = (readingText ?? '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const usesNativePlayer = lesson.type === 'video';
    // `lessonId` é o que a grade e o botão de concluir usam. `lesson.id` pode
    // divergir e faria a aula concluída reabrir como se ainda estivesse pendente.
    const isLessonCompleted =
      neighbors.current?.status === 'COMPLETED' ||
      completedLessonIds.has(lessonId) ||
      completedLessonIds.has(lesson.id);

    const showPurchaseUpsell = lesson.isFreeSample && ownsCourse === false && isLessonCompleted;

    // Quiz conclui só via submit; sem botão "Marcar como concluída".
    const completeButton = !isLessonCompleted && !isQuizLesson && (
      <Button
        label="Marcar como concluída"
        variant="primary"
        className={`${styles.compactButton} ${styles.completeButton}`}
        icon={<Check size={16} aria-hidden="true" />}
        isLoading={isCompleting}
        onClick={() => void handleCompleteLesson()}
      />
    );

    const purchaseUpsell = showPurchaseUpsell ? (
      <aside className={styles.purchaseUpsell} aria-label="Garantir curso completo">
        <p className={styles.purchaseUpsellText}>Gostou da aula? Garanta o curso completo agora</p>
        <Button
          label="Comprar curso"
          variant="primary"
          className={styles.compactButton}
          onClick={() => navigate(`/checkout/${courseId}`)}
        />
      </aside>
    ) : null;

    const handleQuizPassed = () => {
      setCompletedLessonIds((current) => new Set(current).add(lessonId));
      curriculum.refetch();
    };

    return (
      <section className={styles.lesson}>
        <div className={`${styles.layout} ${isReadingLesson ? styles.layoutReading : ''}`}>
          {lesson.type === 'video' ? (
            <div className={styles.playerContainer}>
              {purchaseUpsell}
              <VideoPlayer
                key={lessonId}
                src={lesson.videoUrl ?? ''}
                title={lesson.title}
                lessonId={lesson.id}
                isCompleted={isLessonCompleted}
                courseTitle={courseTitle || lesson.title}
                isLastLesson={isLastLesson}
                onEnded={handleVideoEnded}
                onViewOtherCourses={() => navigate('/aluno/cursos')}
                onViewCertificate={() => {
                  if (certificateCode) {
                    navigate(`/certificados/${certificateCode}`);
                    return;
                  }
                  navigate('/meus-cursos');
                }}
                previousAction={
                  usesNativePlayer && (
                    <NavigationButton
                      actualLesson={lesson}
                      targetLesson={previousLesson}
                      direction="previous"
                      onNavigate={(target) => goToLesson(target.id)}
                    />
                  )
                }
                nextAction={
                  usesNativePlayer && (
                    <NavigationButton
                      actualLesson={lesson}
                      targetLesson={navigableNext}
                      direction="next"
                      onNavigate={(target) => goToLesson(target.id)}
                    />
                  )
                }
                controlsAction={usesNativePlayer && completeButton}
              />
            </div>
          ) : null}

          <div className={styles.mainColumn}>
            {lesson.type !== 'video' ? purchaseUpsell : null}

            <header className={styles.header}>
              {lessonMetadata && <span className={styles.breadcrumb}>{lessonMetadata}</span>}

              <h1>{lesson.title}</h1>
            </header>

            {isReadingLesson && (textParagraphs.length > 0 || lesson.fileUrl) && (
              <article className={styles.textLesson} aria-label="Conteúdo da aula">
                {textParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}

                {lesson.type === 'file' && lesson.fileUrl && (
                  <a
                    className={styles.fileLink}
                    href={lesson.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText size={16} aria-hidden="true" />
                    Abrir arquivo da aula
                  </a>
                )}
              </article>
            )}

            {isQuizLesson ? (
              <LessonQuizPlayer
                key={lessonId}
                courseId={courseId}
                lessonId={lessonId}
                questions={lesson.studentQuizQuestions ?? []}
                minPassPercentage={lesson.minQuizPassPercentage ?? 70}
                alreadyCompleted={isLessonCompleted}
                onPassed={handleQuizPassed}
              />
            ) : null}

            {/* US-12: conteúdo textual da aula; sem player, o texto já aparece acima */}
            <LessonContent
              description={isReadingLesson || isQuizLesson ? null : lesson.description}
              concepts={lesson.concepts}
            />
            <LessonReferences references={lesson.references} />

            {/* US-16: materiais complementares */}
            <section className={styles.reservedArea} data-area="Materiais" aria-label="Materiais" />

            {/* US-14/US-15: sem o player nativo, a navegação e a conclusão ficam
                na coluna do conteúdo — assim o botão não sobrepõe o menu. */}
            <nav
              className={styles.bottomNavigation}
              data-area="Navegação inferior"
              aria-label="Navegação inferior"
            >
              {!usesNativePlayer && (
                <>
                  <div className={styles.navigationGroup}>
                    {previousLesson && (
                      <Button
                        label="Aula anterior"
                        variant="outlined"
                        className={`${styles.compactButton} ${styles.outlinedButton}`}
                        icon={<ChevronLeft size={16} aria-hidden="true" />}
                        onClick={() => goToLesson(previousLesson.id)}
                      />
                    )}
                  </div>

                  <div className={styles.navigationGroup}>
                    {completeButton}
                    {navigableNext && (
                      <Button
                        label="Próxima aula"
                        variant="outlined"
                        className={`${styles.compactButton} ${styles.outlinedButton}`}
                        icon={<ChevronRight size={16} aria-hidden="true" />}
                        onClick={() => goToLesson(navigableNext.id)}
                      />
                    )}
                  </div>
                </>
              )}

              {completeError && (
                <p className={styles.completeError} role="alert">
                  {completeError}
                </p>
              )}
            </nav>
          </div>

          {lessonMenu}
        </div>
      </section>
    );
  };

  return (
    <AuthenticatedLayout role="student" user={mockUser} items={SIDEBAR_MENU_PRESETS.student} wide>
      <div className={styles.page}>{renderContent()}</div>
      <CourseRatingModal
        open={isRatingOpen}
        onOpenChange={setIsRatingOpen}
        courseId={courseId}
        courseTitle={courseTitle || undefined}
        onRated={() => {
          clearCourseRatingSkipped(courseId);
        }}
        onSkip={() => {
          markCourseRatingSkipped(courseId);
        }}
      />
    </AuthenticatedLayout>
  );
};
