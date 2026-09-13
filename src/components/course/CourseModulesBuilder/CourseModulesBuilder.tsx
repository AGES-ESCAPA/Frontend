import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  CirclePlus,
  CirclePlay,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { LessonModal } from '@components/ui';
import { courseModulesApi } from '@services/courseModules';
import type {
  CourseContent,
  CourseContentType,
  CourseModule,
  CourseModuleClient,
} from '@services/courseModules';
import { createLesson as persistLessonRequest } from '@services/lessonService';
import type { Lesson, LessonPayload } from '@/types/lesson';
import styles from './CourseModulesBuilder.module.css';

export interface CourseModulesBuilderProps {
  courseId: string;
  initialModules: CourseModule[];
  client?: CourseModuleClient;
  createLesson?: (payload: LessonPayload) => Promise<Lesson>;
}

type BuilderStatus = 'idle' | 'saving' | 'success' | 'error';

const sortModulesByOrder = (modules: CourseModule[]) =>
  [...modules].sort((current, next) => current.order - next.order);

const createTemporaryId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `temporary-${Date.now()}`;

const createFallbackModule = (id: string, title: string, order: number): CourseModule => ({
  id,
  title,
  order,
  totalContents: 0,
  totalDurationMinutes: 0,
  contents: [],
});

const reindexModules = (modules: CourseModule[]) =>
  modules.map((module, index) => ({
    ...module,
    order: index + 1,
  }));

const formatModuleDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
};

const mapLessonToCourseContent = (lesson: Lesson, fallbackOrder: number): CourseContent => ({
  id: lesson.id,
  title: lesson.title,
  type: lesson.type.toUpperCase() as CourseContentType,
  order: lesson.order ?? fallbackOrder,
  durationMinutes:
    lesson.durationInSeconds != null ? Math.round(lesson.durationInSeconds / 60) : undefined,
});

const appendLessonToModule = (module: CourseModule, lesson: Lesson): CourseModule => {
  const content = mapLessonToCourseContent(lesson, module.contents.length + 1);
  const contents = [...module.contents, content];

  return {
    ...module,
    contents,
    totalContents: contents.length,
    totalDurationMinutes: module.totalDurationMinutes + (content.durationMinutes ?? 0),
  };
};

export const CourseModulesBuilder = ({
  courseId,
  initialModules,
  client = courseModulesApi,
  createLesson = persistLessonRequest,
}: CourseModulesBuilderProps) => {
  const [modules, setModules] = useState(() => sortModulesByOrder(initialModules));
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(() => new Set());
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);
  const [lessonTarget, setLessonTarget] = useState<{
    moduleId: string;
    moduleName: string;
    moduleOrder: number;
  } | null>(null);
  const [status, setStatus] = useState<BuilderStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const savedTitlesRef = useRef(
    new Map(initialModules.map((module) => [module.id, module.title] as const)),
  );

  const orderedModules = useMemo(() => sortModulesByOrder(modules), [modules]);

  useEffect(() => {
    const sortedModules = sortModulesByOrder(initialModules);

    setModules(sortedModules);
    savedTitlesRef.current = new Map(sortedModules.map((module) => [module.id, module.title]));
  }, [initialModules]);

  const setFeedback = (nextStatus: BuilderStatus, message: string) => {
    setStatus(nextStatus);
    setStatusMessage(message);
  };

  const toggleExpanded = (moduleId: string) => {
    setExpandedModuleIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(moduleId)) {
        nextIds.delete(moduleId);
      } else {
        nextIds.add(moduleId);
      }

      return nextIds;
    });
  };

  const handleAddModule = async () => {
    const title = `Novo módulo ${orderedModules.length + 1}`;

    setFeedback('saving', 'Criando módulo...');

    try {
      const createdModule = await client.createModule(courseId, title);

      setModules((currentModules) =>
        reindexModules([
          ...currentModules,
          createdModule ?? createFallbackModule(createTemporaryId(), title, 1),
        ]),
      );
      if (createdModule) {
        savedTitlesRef.current.set(createdModule.id, createdModule.title);
      }
      setFeedback('success', 'Módulo adicionado.');
    } catch (error) {
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível criar o módulo.',
      );
    }
  };

  const updateModuleTitleLocally = (moduleId: string, title: string) => {
    setModules((currentModules) =>
      currentModules.map((module) => (module.id === moduleId ? { ...module, title } : module)),
    );
  };

  const handleRenameModule = async (moduleId: string, title: string) => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setFeedback('error', 'O título do módulo não pode ficar em branco.');
      return;
    }

    const currentModule = modules.find((module) => module.id === moduleId);
    const savedTitle = savedTitlesRef.current.get(moduleId) ?? currentModule?.title;

    if (!currentModule || savedTitle === normalizedTitle) {
      return;
    }

    updateModuleTitleLocally(moduleId, normalizedTitle);
    setFeedback('saving', 'Salvando título do módulo...');

    try {
      const updatedModule = await client.updateModuleTitle(moduleId, normalizedTitle);

      setModules((currentModules) =>
        currentModules.map((module) =>
          module.id === moduleId
            ? { ...module, ...updatedModule, title: updatedModule.title }
            : module,
        ),
      );
      savedTitlesRef.current.set(moduleId, updatedModule.title);
      setFeedback('success', 'Título atualizado.');
    } catch (error) {
      setModules((currentModules) =>
        currentModules.map((module) =>
          module.id === moduleId
            ? { ...currentModule, title: savedTitle ?? currentModule.title }
            : module,
        ),
      );
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível salvar o título.',
      );
    }
  };

  const persistModuleOrder = async (
    nextModules: CourseModule[],
    previousModules: CourseModule[],
  ) => {
    const reindexedModules = reindexModules(nextModules);
    const moduleIds = reindexedModules.map((module) => module.id);

    setModules(reindexedModules);
    setFeedback('saving', 'Salvando nova ordem dos módulos...');

    try {
      await client.reorderModules(courseId, moduleIds);
      setFeedback('success', 'Ordem dos módulos salva.');
    } catch (error) {
      setModules(previousModules);
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível salvar a ordem.',
      );
    }
  };

  const handleDragStart = (moduleId: string) => {
    setDraggingModuleId(moduleId);
  };

  const handleDrop = async (targetModuleId: string) => {
    if (draggingModuleId === null || draggingModuleId === targetModuleId) {
      setDraggingModuleId(null);
      setDragOverModuleId(null);
      return;
    }

    const previousModules = orderedModules;
    const draggingModule = orderedModules.find((module) => module.id === draggingModuleId);

    if (!draggingModule) {
      setDraggingModuleId(null);
      setDragOverModuleId(null);
      return;
    }

    const modulesWithoutDragged = orderedModules.filter((module) => module.id !== draggingModuleId);
    const targetIndex = modulesWithoutDragged.findIndex((module) => module.id === targetModuleId);
    const nextModules = [...modulesWithoutDragged];

    nextModules.splice(targetIndex, 0, draggingModule);
    setDraggingModuleId(null);
    setDragOverModuleId(null);
    await persistModuleOrder(nextModules, previousModules);
  };

  const handleDeleteModule = async (moduleId: string) => {
    const moduleToDelete = modules.find((module) => module.id === moduleId);

    if (!moduleToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${moduleToDelete.title}"? As aulas vinculadas a este módulo também serão removidas.`,
    );

    if (!confirmed) {
      return;
    }

    const previousModules = orderedModules;

    setModules((currentModules) =>
      reindexModules(currentModules.filter((module) => module.id !== moduleId)),
    );
    setExpandedModuleIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(moduleId);
      return nextIds;
    });
    setFeedback('saving', 'Excluindo módulo...');

    try {
      await client.deleteModule(moduleId);
      savedTitlesRef.current.delete(moduleId);
      setFeedback('success', 'Módulo excluído.');
    } catch (error) {
      setModules(previousModules);
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível excluir o módulo.',
      );
    }
  };

  const handleCreateLesson = async (payload: LessonPayload) => {
    setFeedback('saving', 'Criando aula...');

    try {
      const createdLesson = await createLesson(payload);

      setModules((currentModules) =>
        currentModules.map((module) =>
          module.id === payload.moduleId ? appendLessonToModule(module, createdLesson) : module,
        ),
      );
      setFeedback('success', 'Aula adicionada.');
    } catch (error) {
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível criar a aula.',
      );
      throw error;
    }
  };

  return (
    <section className={styles.builder} aria-label="Estrutura de conteúdo do curso">
      {statusMessage ? (
        <p className={styles.statusMessage} data-status={status} role="status">
          {statusMessage}
        </p>
      ) : null}

      <ol className={styles.moduleList}>
        {orderedModules.map((module, index) => {
          const moduleNumber = index + 1;
          const isExpanded = expandedModuleIds.has(module.id);
          const lessons = [...module.contents].sort((current, next) => current.order - next.order);
          const moduleTitleId = `module-${module.id}-title`;

          return (
            <li
              className={`${styles.moduleCard} ${
                dragOverModuleId === module.id ? styles.dragOver : ''
              } ${draggingModuleId === module.id ? styles.dragging : ''}`}
              key={module.id}
              draggable={status !== 'saving'}
              onDragStart={() => handleDragStart(module.id)}
              onDragEnd={() => {
                setDraggingModuleId(null);
                setDragOverModuleId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverModuleId(module.id);
              }}
              onDragLeave={() => setDragOverModuleId(null)}
              onDrop={(event) => {
                event.preventDefault();
                void handleDrop(module.id);
              }}
            >
              <article aria-labelledby={moduleTitleId}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleTitleCluster}>
                    <span
                      className={styles.dragHandle}
                      aria-label={`Arrastar Módulo ${moduleNumber}`}
                    >
                      <GripVertical size={22} aria-hidden="true" />
                    </span>
                    <div className={styles.moduleTitleText}>
                      <label className={styles.titleField} htmlFor={moduleTitleId}>
                        <span className={styles.modulePrefix}>{`Módulo ${moduleNumber}:`}</span>
                        <input
                          id={moduleTitleId}
                          ref={(element) => {
                            titleInputRefs.current[module.id] = element;
                          }}
                          aria-label={`Título do Módulo ${moduleNumber}`}
                          value={module.title}
                          disabled={status === 'saving'}
                          onChange={(event) =>
                            updateModuleTitleLocally(module.id, event.currentTarget.value)
                          }
                          onBlur={(event) =>
                            handleRenameModule(module.id, event.currentTarget.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </label>
                      <p>{`${module.totalContents} aulas · ${formatModuleDuration(
                        module.totalDurationMinutes,
                      )}`}</p>
                    </div>
                  </div>

                  <div className={styles.moduleActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      disabled={status === 'saving'}
                      aria-label={`Editar Módulo ${moduleNumber}`}
                      onClick={() => titleInputRefs.current[module.id]?.focus()}
                    >
                      <Pencil size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() => handleDeleteModule(module.id)}
                      disabled={status === 'saving'}
                      aria-label={`Excluir Módulo ${moduleNumber}`}
                    >
                      <Trash2 size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => toggleExpanded(module.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`module-${module.id}-lessons`}
                      aria-label={
                        isExpanded
                          ? `Recolher Módulo ${moduleNumber}`
                          : `Expandir Módulo ${moduleNumber}`
                      }
                    >
                      <ChevronDown
                        className={isExpanded ? styles.chevronOpen : ''}
                        size={20}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className={styles.lessonPanel} id={`module-${module.id}-lessons`}>
                    {lessons.length > 0 ? (
                      <ul className={styles.lessonList}>
                        {lessons.map((lesson) => (
                          <li key={lesson.id} className={styles.lessonItem}>
                            <GripVertical size={18} aria-hidden="true" />
                            {lesson.type === 'VIDEO' ? (
                              <CirclePlay size={18} aria-hidden="true" />
                            ) : (
                              <FileText size={18} aria-hidden="true" />
                            )}
                            <span>{lesson.title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.emptyLessons}>Nenhuma aula vinculada a este módulo.</p>
                    )}
                    <button
                      type="button"
                      className={styles.addLessonButton}
                      disabled={status === 'saving'}
                      aria-label={`Adicionar aula ao Módulo ${moduleNumber}`}
                      onClick={() =>
                        setLessonTarget({
                          moduleId: module.id,
                          moduleName: module.title,
                          moduleOrder: moduleNumber,
                        })
                      }
                    >
                      <Plus size={16} strokeWidth={2} aria-hidden="true" />
                      Adicionar Aula
                    </button>
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={styles.addModuleCard}
        onClick={handleAddModule}
        disabled={status === 'saving'}
      >
        <CirclePlus size={28} aria-hidden="true" />
        <strong>+ Adicionar Módulo</strong>
        <span>Crie uma nova seção para organizar o conteúdo do curso.</span>
      </button>

      {lessonTarget ? (
        <LessonModal
          open
          onOpenChange={(open) => {
            if (!open) setLessonTarget(null);
          }}
          moduleId={lessonTarget.moduleId}
          moduleName={lessonTarget.moduleName}
          moduleOrder={lessonTarget.moduleOrder}
          onSubmit={handleCreateLesson}
        />
      ) : null}
    </section>
  );
};
