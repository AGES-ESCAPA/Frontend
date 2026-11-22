import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, GitBranch, Info, Layers } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { CourseModulesBuilder } from '@components/course';
import { Badge, Button, PageHeader, Toast, type BadgeVariant } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { useCourseForm } from '@hooks/useCourseForm';
import { useToast } from '@hooks/useToast';
import {
  addCoursePrerequisite,
  createCourse,
  getCourseById,
  getCourseRules,
  listCourseCategories,
  publishCourse,
  removeCoursePrerequisite,
  searchCoursePrerequisites,
  updateCourse,
  updateProgressRules,
} from '@services/courseService';
import { courseModulesApi } from '@services/courseModules';
import type { AdminCourseModule } from '@/types/module';
import type {
  CoursePrerequisiteOption,
  CourseProgressRules,
  CourseRules,
  CourseStatus,
  CourseVersionLogEntry,
} from '@/types/course';
import {
  buildCoursePayload,
  courseDetailToFormValues,
  hasCourseFormErrors,
  validateCourseForm,
} from '@utils/courseForm';
import { BasicInfoCard } from './components/BasicInfoCard/BasicInfoCard';
import { formatDateTime } from '@utils/formatters';
import { ClassificationCard } from './components/ClassificationCard/ClassificationCard';
import { DescriptionCard } from './components/DescriptionCard/DescriptionCard';
import { MetricsCard } from './components/MetricsCard/MetricsCard';
import { PrerequisiteCoursesCard } from './components/PrerequisiteCoursesCard/PrerequisiteCoursesCard';
import { ProgressRulesCard } from './components/ProgressRulesCard/ProgressRulesCard';
import { VersionControlCard } from './components/VersionControlCard/VersionControlCard';
import styles from './CourseBuilder.module.css';

const COURSES_ROUTE = '/admin/cursos';

const ADMIN_USER: SidebarUser = {
  name: 'Admin',
  role: 'Administrador',
  email: 'admin@escapa.com',
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const STATUS_VARIANTS: Record<CourseStatus, BadgeVariant> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

const TAB_ICON_SIZE = 14;

const PREREQUISITE_SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_PROGRESS_RULES: CourseProgressRules = {
  requireSequentialProgress: true,
  blockAccessAfterDeadline: false,
  minQuizPassPercentage: 70,
};

const toVersionLabel = (version: string): string => {
  const normalized = version.trim();
  return normalized ? `V ${normalized}` : 'V 0.0';
};

const toVersionLog = (rules: CourseRules): CourseVersionLogEntry[] =>
  rules.changeLog.map((entry) => ({
    id: entry.id,
    timestampLabel: entry.createdAt ? formatDateTime(entry.createdAt) : '',
    description: entry.description,
    author: entry.changedBy?.trim() || 'Sistema',
  }));
export const CourseBuilder = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { values, errors, changeField, replaceValues, replaceErrors } = useCourseForm();
  const { toast, isOpen: isToastOpen, showToast, dismissToast } = useToast();

  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [status, setStatus] = useState<CourseStatus>('DRAFT');
  const [savingStatus, setSavingStatus] = useState<CourseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(courseId !== undefined);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [modules, setModules] = useState<AdminCourseModule[]>([]);
  const [isModulesLoading, setIsModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [modulesReloadToken, setModulesReloadToken] = useState(0);

  const [progressRules, setProgressRules] = useState<CourseProgressRules>(DEFAULT_PROGRESS_RULES);
  const progressRulesRef = useRef(progressRules);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<CoursePrerequisiteOption[]>(
    [],
  );
  const selectedPrerequisitesRef = useRef(selectedPrerequisites);
  const savedConfigurationRef = useRef({
    requireSequentialProgress: DEFAULT_PROGRESS_RULES.requireSequentialProgress,
    blockAccessAfterDeadline: DEFAULT_PROGRESS_RULES.blockAccessAfterDeadline,
    minQuizPassPercentage: DEFAULT_PROGRESS_RULES.minQuizPassPercentage,
    prerequisiteIds: [] as string[],
  });
  progressRulesRef.current = progressRules;
  selectedPrerequisitesRef.current = selectedPrerequisites;
  const [prerequisiteQuery, setPrerequisiteQuery] = useState('');
  const [prerequisiteSuggestions, setPrerequisiteSuggestions] = useState<
    CoursePrerequisiteOption[]
  >([]);
  const [isSearchingPrerequisites, setIsSearchingPrerequisites] = useState(false);
  const [prerequisiteSearchError, setPrerequisiteSearchError] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState('V 0.0');
  const [versionLog, setVersionLog] = useState<CourseVersionLogEntry[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [rulesReloadToken, setRulesReloadToken] = useState(0);
  const [notifyStudentsOnPublish, setNotifyStudentsOnPublish] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const coverUploadsRef = useRef(0);

  const isSaving = savingStatus !== null;
  const isFormDisabled = isLoading || isSaving || loadError || isCoverUploading;

  /**
   * Guarda o id que acabamos de criar/salvar, pra o efeito de carregamento
   * abaixo saber que os dados já estão em mãos (veio na resposta do
   * createCourse) e não precisa refazer o GET só porque a navegação para a
   * rota de edição trocou o `courseId` com o componente ainda montado.
   */
  const skipNextLoadIdRef = useRef<string | null>(null);
  const skipNextRulesLoadIdRef = useRef<string | null>(null);

  const menuItems = useMemo(
    () => SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({ ...item, active: index === 0 })),
    [],
  );

  const builderTabs = useMemo(
    () => [
      {
        value: 'basics',
        label: 'Informações Básicas',
        icon: <Info size={TAB_ICON_SIZE} />,
        available: true,
      },
      {
        value: 'content',
        label: 'Estrutura de Conteúdo',
        icon: <Layers size={TAB_ICON_SIZE} />,
        available: true,
      },
      {
        value: 'rules',
        label: 'Regras & Pré Requisitos',
        icon: <GitBranch size={TAB_ICON_SIZE} />,
        available: true,
      },
    ],
    [],
  );

  useEffect(() => {
    let isCurrent = true;
    setIsCategoriesLoading(true);

    listCourseCategories()
      .then((loadedCategories) => {
        if (isCurrent) setCategories(loadedCategories);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setCategories([]);
        showToast(
          'error',
          'Não foi possível carregar as categorias',
          error instanceof Error ? error.message : undefined,
        );
      })
      .finally(() => {
        if (isCurrent) setIsCategoriesLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (courseId === undefined) return undefined;

    if (skipNextLoadIdRef.current === courseId) {
      skipNextLoadIdRef.current = null;
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setLoadError(false);

    getCourseById(courseId)
      .then((course) => {
        if (!isCurrent) return;
        replaceValues(courseDetailToFormValues(course));
        setStatus(course.status);
        setFeatured(Boolean(course.featured));
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadError(true);
        showToast(
          'error',
          'Não foi possível carregar o curso',
          error instanceof Error ? error.message : undefined,
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [courseId, reloadToken, replaceValues, showToast]);

  const handleRetryLoad = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const handleCoverUploadingChange = useCallback((uploading: boolean) => {
    coverUploadsRef.current = Math.max(0, coverUploadsRef.current + (uploading ? 1 : -1));
    setIsCoverUploading(coverUploadsRef.current > 0);
  }, []);

  /**
   * A estrutura de conteúdo só existe para um curso já salvo: sem `courseId`
   * não há para onde criar módulos. Nesse caso a aba mostra um aviso e não
   * consulta a API.
   */
  useEffect(() => {
    if (courseId === undefined) {
      setModules([]);
      setModulesError(null);
      return undefined;
    }

    let isCurrent = true;
    setIsModulesLoading(true);
    setModulesError(null);

    courseModulesApi
      .listModules(courseId)
      .then((loadedModules) => {
        if (isCurrent) setModules(loadedModules);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setModules([]);
        setModulesError(
          error instanceof Error ? error.message : 'Não foi possível carregar os módulos do curso.',
        );
      })
      .finally(() => {
        if (isCurrent) setIsModulesLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [courseId, modulesReloadToken]);

  const handleRetryModulesLoad = useCallback(() => {
    setModulesReloadToken((token) => token + 1);
  }, []);

  const applyRules = useCallback((rules: CourseRules) => {
    const nextRules: CourseProgressRules = {
      requireSequentialProgress: rules.requireSequentialProgress,
      blockAccessAfterDeadline: rules.enforceDeadlineBlock,
      minQuizPassPercentage: rules.minQuizPassPercentage ?? 70,
    };
    const nextPrerequisites = rules.prerequisites.map((item) => ({
      id: item.courseId,
      title: item.courseTitle,
    }));
    progressRulesRef.current = nextRules;
    selectedPrerequisitesRef.current = nextPrerequisites;
    savedConfigurationRef.current = {
      requireSequentialProgress: nextRules.requireSequentialProgress,
      blockAccessAfterDeadline: nextRules.blockAccessAfterDeadline,
      minQuizPassPercentage: nextRules.minQuizPassPercentage,
      prerequisiteIds: nextPrerequisites.map((item) => item.id),
    };
    setProgressRules(nextRules);
    setSelectedPrerequisites(nextPrerequisites);
    setVersionLabel(toVersionLabel(rules.version));
    setVersionLog(toVersionLog(rules));
  }, []);

  const loadedCourseIdRef = useRef<string | undefined>(courseId);

  useEffect(() => {
    if (courseId === undefined) {
      if (loadedCourseIdRef.current !== undefined) {
        progressRulesRef.current = DEFAULT_PROGRESS_RULES;
        selectedPrerequisitesRef.current = [];
        savedConfigurationRef.current = {
          requireSequentialProgress: DEFAULT_PROGRESS_RULES.requireSequentialProgress,
          blockAccessAfterDeadline: DEFAULT_PROGRESS_RULES.blockAccessAfterDeadline,
          minQuizPassPercentage: DEFAULT_PROGRESS_RULES.minQuizPassPercentage,
          prerequisiteIds: [],
        };
        setProgressRules(DEFAULT_PROGRESS_RULES);
        setSelectedPrerequisites([]);
        setPrerequisiteQuery('');
        setPrerequisiteSuggestions([]);
        setVersionLabel('V 0.0');
        setVersionLog([]);
        setRulesError(null);
        setIsRulesLoading(false);
      }
      loadedCourseIdRef.current = undefined;
      return undefined;
    }

    if (skipNextRulesLoadIdRef.current === courseId) {
      skipNextRulesLoadIdRef.current = null;
      loadedCourseIdRef.current = courseId;
      return undefined;
    }

    loadedCourseIdRef.current = courseId;

    let isCurrent = true;
    setIsRulesLoading(true);
    setRulesError(null);

    getCourseRules(courseId)
      .then((rules) => {
        if (isCurrent) applyRules(rules);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setRulesError(
          error instanceof Error ? error.message : 'Não foi possível carregar as regras do curso.',
        );
      })
      .finally(() => {
        if (isCurrent) setIsRulesLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [applyRules, courseId, rulesReloadToken]);

  useEffect(() => {
    const query = prerequisiteQuery.trim();
    if (courseId === undefined || query === '') {
      setPrerequisiteSuggestions((current) => (current.length === 0 ? current : []));
      setIsSearchingPrerequisites((current) => (current ? false : current));
      setPrerequisiteSearchError((current) => (current === null ? current : null));
      return undefined;
    }

    let isCurrent = true;
    setPrerequisiteSuggestions([]);
    setIsSearchingPrerequisites(true);
    setPrerequisiteSearchError(null);

    const timeoutId = window.setTimeout(() => {
      searchCoursePrerequisites(courseId, query)
        .then((results) => {
          if (!isCurrent) return;
          setPrerequisiteSuggestions(
            results.map((course) => ({ id: course.id, title: course.title })),
          );
        })
        .catch((error: unknown) => {
          if (!isCurrent) return;
          setPrerequisiteSuggestions([]);
          setPrerequisiteSearchError(
            error instanceof Error ? error.message : 'Não foi possível buscar cursos.',
          );
        })
        .finally(() => {
          if (isCurrent) setIsSearchingPrerequisites(false);
        });
    }, PREREQUISITE_SEARCH_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [courseId, prerequisiteQuery]);

  const handleRetryRulesLoad = useCallback(() => {
    setRulesReloadToken((token) => token + 1);
  }, []);

  const handleProgressRuleChange = useCallback(
    <K extends keyof CourseProgressRules>(field: K, value: CourseProgressRules[K]) => {
      setProgressRules((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const handleAddPrerequisite = useCallback((course: CoursePrerequisiteOption) => {
    setSelectedPrerequisites((current) =>
      current.some((item) => item.id === course.id) ? current : [...current, course],
    );
    setPrerequisiteQuery('');
  }, []);

  const handleRemovePrerequisite = useCallback((prerequisiteId: string) => {
    setSelectedPrerequisites((current) => current.filter((item) => item.id !== prerequisiteId));
  }, []);

  /**
   * Regras e pré-requisitos só são gravados aqui, junto com o rascunho ou a
   * publicação. Até esse clique a versão e o histórico permanecem como foram
   * carregados.
   *
   * O baseline em `savedConfigurationRef` avança a cada chamada bem-sucedida,
   * então uma falha no meio não faz o próximo salvamento repetir o que já foi
   * gravado (ex.: POST de pré-requisito, que responderia 400).
   */
  const persistConfiguration = useCallback(async (id: string) => {
    const rules = progressRulesRef.current;
    const saved = savedConfigurationRef.current;
    const rulesChanged =
      rules.requireSequentialProgress !== saved.requireSequentialProgress ||
      rules.blockAccessAfterDeadline !== saved.blockAccessAfterDeadline ||
      rules.minQuizPassPercentage !== saved.minQuizPassPercentage;

    if (rulesChanged) {
      await updateProgressRules(id, {
        requireSequentialProgress: rules.requireSequentialProgress,
        enforceDeadlineBlock: rules.blockAccessAfterDeadline,
        minQuizPassPercentage: rules.minQuizPassPercentage,
      });
      savedConfigurationRef.current = {
        ...savedConfigurationRef.current,
        requireSequentialProgress: rules.requireSequentialProgress,
        blockAccessAfterDeadline: rules.blockAccessAfterDeadline,
        minQuizPassPercentage: rules.minQuizPassPercentage,
      };
    }

    const currentIds = selectedPrerequisitesRef.current.map((item) => item.id);
    const savedIds = new Set(saved.prerequisiteIds);
    const currentIdSet = new Set(currentIds);

    for (const prerequisiteId of currentIds) {
      if (!savedIds.has(prerequisiteId)) {
        await addCoursePrerequisite(id, prerequisiteId);
        savedConfigurationRef.current = {
          ...savedConfigurationRef.current,
          prerequisiteIds: [...savedConfigurationRef.current.prerequisiteIds, prerequisiteId],
        };
      }
    }

    for (const prerequisiteId of saved.prerequisiteIds) {
      if (!currentIdSet.has(prerequisiteId)) {
        await removeCoursePrerequisite(id, prerequisiteId);
        savedConfigurationRef.current = {
          ...savedConfigurationRef.current,
          prerequisiteIds: savedConfigurationRef.current.prerequisiteIds.filter(
            (savedId) => savedId !== prerequisiteId,
          ),
        };
      }
    }
  }, []);

  const handleSave = useCallback(
    async (nextStatus: CourseStatus) => {
      const validationErrors = validateCourseForm(
        values,
        nextStatus === 'PUBLISHED' ? 'publish' : 'draft',
      );
      replaceErrors(validationErrors);

      if (hasCourseFormErrors(validationErrors)) {
        showToast('error', 'Revise o formulário', 'Corrija os campos destacados para continuar.');
        return;
      }

      setSavingStatus(nextStatus);

      const editingPublishedCourse = status === 'PUBLISHED';
      let finalCourseId: string;

      try {
        const payload = buildCoursePayload(values, nextStatus, featured);
        const saved =
          courseId === undefined
            ? await createCourse({ ...payload, instructorId: user?.id })
            : await updateCourse(courseId, payload);

        await persistConfiguration(saved.id);

        if (courseId === undefined) {
          skipNextLoadIdRef.current = saved.id;
          skipNextRulesLoadIdRef.current = saved.id;
          navigate(`${COURSES_ROUTE}/${saved.id}/editar`, { replace: true });
        }

        // Publicar é uma ação separada do salvamento: o PUT só grava os campos
        // do formulário, quem muda o status pra PUBLISHED é o endpoint de
        // publish (que também valida os obrigatórios pra publicação).
        const finalCourse =
          nextStatus === 'PUBLISHED'
            ? await publishCourse(saved.id, { notifyEnrolledStudents: notifyStudentsOnPublish })
            : saved;

        setStatus(finalCourse.status);
        finalCourseId = finalCourse.id;
        showToast(
          'success',
          nextStatus === 'PUBLISHED' ? 'Curso publicado com sucesso!' : 'Rascunho salvo!',
          nextStatus === 'DRAFT' && editingPublishedCourse
            ? 'A versão que os alunos veem, inclusive módulos e aulas, permanece até você publicar o curso.'
            : 'Os dados do curso foram gravados.',
        );
      } catch (error: unknown) {
        // As edições locais são mantidas: o que já foi gravado está refletido em
        // `savedConfigurationRef`, e o restante vai no próximo salvamento.
        showToast(
          'error',
          nextStatus === 'PUBLISHED'
            ? 'Não foi possível publicar o curso'
            : 'Não foi possível salvar o curso',
          error instanceof Error ? error.message : undefined,
        );
        setSavingStatus(null);
        return;
      }

      try {
        applyRules(await getCourseRules(finalCourseId));
      } catch {
        // O salvamento já terminou; sem a releitura, o estado local continua valendo.
      } finally {
        setSavingStatus(null);
      }
    },
    [
      applyRules,
      courseId,
      featured,
      navigate,
      notifyStudentsOnPublish,
      persistConfiguration,
      replaceErrors,
      showToast,
      status,
      user,
      values,
    ],
  );

  const availablePrerequisiteSuggestions = prerequisiteSuggestions.filter(
    (course) => !selectedPrerequisites.some((item) => item.id === course.id),
  );

  const prerequisiteSearchStatus =
    prerequisiteQuery.trim() === ''
      ? null
      : (prerequisiteSearchError ??
        (isSearchingPrerequisites
          ? 'Buscando cursos…'
          : availablePrerequisiteSuggestions.length === 0
            ? 'Nenhum curso encontrado.'
            : null));

  const isRulesDisabled = isFormDisabled;

  return (
    <>
      <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER}>
        <Link to={COURSES_ROUTE} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para Cursos
        </Link>

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <PageHeader
              eyebrow="Painel administrativo • Cursos"
              title={
                <span className={styles.titleWithBadge}>
                  Construtor de Curso
                  <Badge
                    label={STATUS_LABELS[status]}
                    variant={STATUS_VARIANTS[status]}
                    className={styles.statusBadge}
                  />
                </span>
              }
              className={styles.pageHeader}
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              label="Salvar Rascunho"
              className={styles.actionButton}
              isLoading={savingStatus === 'DRAFT'}
              disabled={isFormDisabled}
              onClick={() => void handleSave('DRAFT')}
            />
            <Button
              type="button"
              variant="primary"
              label="Publicar Curso"
              className={styles.actionButton}
              isLoading={savingStatus === 'PUBLISHED'}
              disabled={isFormDisabled}
              onClick={() => void handleSave('PUBLISHED')}
            />
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className={styles.tabList} aria-label="Seções do construtor de curso">
            {builderTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={styles.tab}
                disabled={!tab.available}
              >
                <span className={styles.tabIcon} aria-hidden="true">
                  {tab.icon}
                </span>
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="basics">
            {isLoading ? (
              <p className={styles.loading} role="status">
                Carregando os dados do curso…
              </p>
            ) : null}

            {loadError ? (
              <div className={styles.loadError} role="alert">
                <p>
                  Não foi possível carregar os dados deste curso. Para evitar sobrescrever o
                  conteúdo já salvo, o formulário permanece bloqueado até o carregamento ser
                  concluído com sucesso.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  label="Tentar novamente"
                  onClick={handleRetryLoad}
                />
              </div>
            ) : null}

            <form
              className={styles.grid}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave('PUBLISHED');
              }}
            >
              <BasicInfoCard
                title={values.title}
                teaserVideoUrl={values.teaserVideoUrl}
                shortDescription={values.shortDescription}
                thumbnailUrl={values.thumbnailUrl}
                titleError={errors.title}
                teaserVideoUrlError={errors.teaserVideoUrl}
                shortDescriptionError={errors.shortDescription}
                disabled={isFormDisabled}
                onFieldChange={changeField}
                onCoverUploadingChange={handleCoverUploadingChange}
              />

              <ClassificationCard
                category={values.category}
                difficulty={values.difficulty}
                featured={featured}
                categoryError={errors.category}
                difficultyError={errors.difficulty}
                categories={categories}
                isCategoriesLoading={isCategoriesLoading}
                disabled={isFormDisabled}
                onFieldChange={changeField}
                onFeaturedChange={setFeatured}
              />

              <DescriptionCard
                description={values.description}
                descriptionError={errors.description}
                disabled={isFormDisabled}
                onFieldChange={changeField}
              />

              <MetricsCard
                durationTime={values.durationTime}
                deadline={values.deadline}
                price={values.price}
                durationTimeError={errors.durationTime}
                deadlineError={errors.deadline}
                priceError={errors.price}
                disabled={isFormDisabled}
                onFieldChange={changeField}
              />
            </form>
          </Tabs.Content>

          {/* Montado mesmo inativo: o CourseModulesBuilder guarda localmente o que
              foi criado/editado, e remontar a partir de `modules` perderia isso. */}
          <Tabs.Content value="content" forceMount hidden={activeTab !== 'content'}>
            {courseId === undefined ? (
              <p className={styles.contentNotice} role="status">
                Salve o rascunho do curso para começar a organizar os módulos.
              </p>
            ) : null}

            {courseId !== undefined && isModulesLoading ? (
              <p className={styles.loading} role="status">
                Carregando a estrutura de conteúdo…
              </p>
            ) : null}

            {courseId !== undefined && !isModulesLoading && modulesError !== null ? (
              <div className={styles.loadError} role="alert">
                <p>{modulesError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  label="Tentar novamente"
                  onClick={handleRetryModulesLoad}
                />
              </div>
            ) : null}

            {courseId !== undefined && !isModulesLoading && modulesError === null ? (
              <CourseModulesBuilder
                courseId={courseId}
                initialModules={modules}
                coursePublished={status === 'PUBLISHED'}
              />
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="rules">
            {courseId === undefined ? (
              <p className={styles.contentNotice} role="status">
                Salve o rascunho do curso para configurar as regras, os pré-requisitos e o histórico
                de versões.
              </p>
            ) : null}

            {courseId !== undefined && isRulesLoading ? (
              <p className={styles.loading} role="status">
                Carregando regras e histórico de versões…
              </p>
            ) : null}

            {courseId !== undefined && !isRulesLoading && rulesError !== null ? (
              <div className={styles.loadError} role="alert">
                <p>{rulesError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  label="Tentar novamente"
                  onClick={handleRetryRulesLoad}
                />
              </div>
            ) : null}

            {courseId !== undefined && !isRulesLoading && rulesError === null ? (
              <div className={styles.grid}>
                <div className={styles.progressColumn}>
                  <ProgressRulesCard
                    rules={progressRules}
                    disabled={isRulesDisabled}
                    onChange={handleProgressRuleChange}
                  />
                </div>

                <div className={styles.versionColumn}>
                  <VersionControlCard
                    versionLabel={versionLabel}
                    entries={versionLog}
                    notifyStudentsOnPublish={notifyStudentsOnPublish}
                    disabled={isRulesDisabled}
                    onNotifyStudentsOnPublishChange={setNotifyStudentsOnPublish}
                  />
                </div>

                <PrerequisiteCoursesCard
                  selected={selectedPrerequisites}
                  suggestions={availablePrerequisiteSuggestions}
                  query={prerequisiteQuery}
                  searchStatus={prerequisiteSearchStatus}
                  disabled={isRulesDisabled}
                  onQueryChange={setPrerequisiteQuery}
                  onAdd={handleAddPrerequisite}
                  onRemove={handleRemovePrerequisite}
                />
              </div>
            ) : null}
          </Tabs.Content>
        </Tabs.Root>
      </AuthenticatedLayout>

      {toast === null ? null : (
        <Toast
          key={toast.key}
          open={isToastOpen}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      )}
    </>
  );
};
