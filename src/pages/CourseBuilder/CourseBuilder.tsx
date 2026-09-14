import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, GitBranch, Info, Layers } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { CourseModulesBuilder } from '@components/course';
import { Badge, Button, Toast } from '@components/ui';
import { useCourseForm } from '@hooks/useCourseForm';
import { useToast } from '@hooks/useToast';
import { createCourse, getCourseById, publishCourse, updateCourse } from '@services/courseService';
import { courseModulesApi } from '@services/courseModules';
import type { AdminCourseModule } from '@/types/module';
import type {
  CoursePrerequisiteOption,
  CourseProgressRules,
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

const TAB_ICON_SIZE = 14;

/**
 * A aba "Regras & Pré Requisitos" também não tem endpoint ainda (nem de
 * regras de progresso, nem de pré-requisitos ou histórico de versão — ver
 * TSK-05-BACK). Os dados abaixo só existem pra dar vida à interface; nada
 * aqui é persistido de verdade até o contrato com o backend ser definido.
 */
const MOCK_PROGRESS_RULES: CourseProgressRules = {
  requireSequentialProgress: true,
  blockAccessAfterDeadline: false,
};

const MOCK_PREREQUISITE_CATALOG: CoursePrerequisiteOption[] = [
  { id: 'integracao-corporativa-n1', title: 'Integração Corporativa N1' },
  { id: 'seguranca-informacao-basica', title: 'Segurança da Informação Básica' },
  { id: 'atendimento-hospitalidade-premium', title: 'Atendimento em Hospitalidade Premium' },
  { id: 'gestao-de-crises-turismo', title: 'Gestão de Crises no Turismo' },
];

const MOCK_SELECTED_PREREQUISITES: CoursePrerequisiteOption[] = [
  MOCK_PREREQUISITE_CATALOG[0],
  MOCK_PREREQUISITE_CATALOG[1],
];

const MOCK_VERSION_LABEL = 'V 1.4';

const MOCK_VERSION_LOG: CourseVersionLogEntry[] = [
  {
    id: '1',
    timestampLabel: 'Hoje, 14:30',
    description: 'Alteração nas regras de progressão (Módulo 2).',
    author: 'Admin Gestor',
  },
  {
    id: '2',
    timestampLabel: '12 Out 2023, 09:15',
    description: 'Adicionado curso "Segurança da Informação" como pré-requisito.',
    author: 'Admin Gestor',
  },
  {
    id: '3',
    timestampLabel: '05 Out 2023, 16:40',
    description: 'Versão 1.0 publicada.',
    author: 'Sistema',
  },
];

export const CourseBuilder = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { values, errors, changeField, replaceValues, replaceErrors } = useCourseForm();
  const { toast, isOpen: isToastOpen, showToast, dismissToast } = useToast();

  const [status, setStatus] = useState<CourseStatus>('DRAFT');
  const [savingStatus, setSavingStatus] = useState<CourseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(courseId !== undefined);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [modules, setModules] = useState<AdminCourseModule[]>([]);
  const [isModulesLoading, setIsModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [modulesReloadToken, setModulesReloadToken] = useState(0);

  const [progressRules, setProgressRules] = useState<CourseProgressRules>(MOCK_PROGRESS_RULES);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<CoursePrerequisiteOption[]>(
    MOCK_SELECTED_PREREQUISITES,
  );
  const [notifyStudentsOnPublish, setNotifyStudentsOnPublish] = useState(false);

  const isSaving = savingStatus !== null;
  const isFormDisabled = isLoading || isSaving || loadError;

  /**
   * Guarda o id que acabamos de criar/salvar, pra o efeito de carregamento
   * abaixo saber que os dados já estão em mãos (veio na resposta do
   * createCourse) e não precisa refazer o GET só porque a navegação para a
   * rota de edição trocou o `courseId` com o componente ainda montado.
   */
  const skipNextLoadIdRef = useRef<string | null>(null);

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

  const handleProgressRuleChange = useCallback(
    (field: keyof CourseProgressRules, value: boolean) => {
      setProgressRules((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const handleAddPrerequisite = useCallback((course: CoursePrerequisiteOption) => {
    setSelectedPrerequisites((current) =>
      current.some((item) => item.id === course.id) ? current : [...current, course],
    );
  }, []);

  const handleRemovePrerequisite = useCallback((prerequisiteId: string) => {
    setSelectedPrerequisites((current) => current.filter((item) => item.id !== prerequisiteId));
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

      try {
        const payload = buildCoursePayload(values, nextStatus);
        const saved =
          courseId === undefined
            ? await createCourse(payload)
            : await updateCourse(courseId, payload);

        if (courseId === undefined) {
          skipNextLoadIdRef.current = saved.id;
          navigate(`${COURSES_ROUTE}/${saved.id}/editar`, { replace: true });
        }

        // Publicar é uma ação separada do salvamento: o PUT só grava os campos
        // do formulário, quem muda o status pra PUBLISHED é o endpoint de
        // publish (que também valida os obrigatórios pra publicação).
        const finalCourse = nextStatus === 'PUBLISHED' ? await publishCourse(saved.id) : saved;

        setStatus(finalCourse.status);
        showToast(
          'success',
          nextStatus === 'PUBLISHED' ? 'Curso publicado com sucesso!' : 'Rascunho salvo!',
          'Os dados do curso foram gravados.',
        );
      } catch (error: unknown) {
        showToast(
          'error',
          nextStatus === 'PUBLISHED'
            ? 'Não foi possível publicar o curso'
            : 'Não foi possível salvar o curso',
          error instanceof Error ? error.message : undefined,
        );
      } finally {
        setSavingStatus(null);
      }
    },
    [courseId, navigate, replaceErrors, showToast, values],
  );

  const handleLogout = useCallback(() => {
    window.location.assign('/');
  }, []);

  return (
    <>
      <AuthenticatedLayout role="admin" items={menuItems} user={ADMIN_USER} onLogout={handleLogout}>
        <Link to={COURSES_ROUTE} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para Cursos
        </Link>

        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Construtor de Curso</h1>
            <Badge label={STATUS_LABELS[status]} variant="primary" className={styles.statusBadge} />
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
        </header>

        <Tabs.Root defaultValue="basics">
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
                titleError={errors.title}
                teaserVideoUrlError={errors.teaserVideoUrl}
                shortDescriptionError={errors.shortDescription}
                disabled={isFormDisabled}
                onFieldChange={changeField}
              />

              <ClassificationCard
                category={values.category}
                difficulty={values.difficulty}
                categoryError={errors.category}
                difficultyError={errors.difficulty}
                disabled={isFormDisabled}
                onFieldChange={changeField}
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

          <Tabs.Content value="content">
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
              <CourseModulesBuilder courseId={courseId} initialModules={modules} />
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="rules">
            <div className={styles.grid}>
              <ProgressRulesCard
                rules={progressRules}
                disabled={isFormDisabled}
                onChange={handleProgressRuleChange}
              />

              <div className={styles.versionColumn}>
                <VersionControlCard
                  versionLabel={MOCK_VERSION_LABEL}
                  entries={MOCK_VERSION_LOG}
                  notifyStudentsOnPublish={notifyStudentsOnPublish}
                  disabled={isFormDisabled}
                  onNotifyStudentsOnPublishChange={setNotifyStudentsOnPublish}
                />
              </div>

              <PrerequisiteCoursesCard
                selected={selectedPrerequisites}
                options={MOCK_PREREQUISITE_CATALOG}
                disabled={isFormDisabled}
                onAdd={handleAddPrerequisite}
                onRemove={handleRemovePrerequisite}
              />
            </div>
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
