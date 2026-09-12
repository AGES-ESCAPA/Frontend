import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, GitBranch, Info, Layers } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { Badge, Button, Toast } from '@components/ui';
import { useCourseForm } from '@hooks/useCourseForm';
import { useToast } from '@hooks/useToast';
import { createCourse, getCourseById, updateCourse } from '@services/courseService';
import type { CourseStatus } from '@/types/course';
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

const BUILDER_TABS = [
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
    available: false,
  },
  {
    value: 'rules',
    label: 'Regras & Pré Requisitos',
    icon: <GitBranch size={TAB_ICON_SIZE} />,
    available: false,
  },
];

export const CourseBuilder = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { values, errors, changeField, replaceValues, replaceErrors } = useCourseForm();
  const { toast, showToast, dismissToast } = useToast();

  const [status, setStatus] = useState<CourseStatus>('DRAFT');
  const [savingStatus, setSavingStatus] = useState<CourseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(courseId !== undefined);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const isSaving = savingStatus !== null;
  const isFormDisabled = isLoading || isSaving || loadError;

  const menuItems = useMemo(
    () => SIDEBAR_MENU_PRESETS.admin.map((item, index) => ({ ...item, active: index === 0 })),
    [],
  );

  useEffect(() => {
    if (courseId === undefined) return undefined;

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

        setStatus(saved.status);
        showToast(
          'success',
          nextStatus === 'PUBLISHED' ? 'Curso publicado com sucesso!' : 'Rascunho salvo!',
          'Os dados do curso foram gravados.',
        );

        if (courseId === undefined) {
          navigate(`${COURSES_ROUTE}/${saved.id}/editar`, { replace: true });
        }
      } catch (error: unknown) {
        showToast(
          'error',
          'Não foi possível salvar o curso',
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
            {BUILDER_TABS.map((tab) => (
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
        </Tabs.Root>
      </AuthenticatedLayout>

      {toast === null ? null : (
        <Toast
          key={toast.key}
          open
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
