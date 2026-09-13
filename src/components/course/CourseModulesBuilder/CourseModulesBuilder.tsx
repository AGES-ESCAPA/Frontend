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
import { ConfirmDialog, LessonModal } from '@components/ui';
import { courseModulesApi } from '@services/courseModules';
import { createLesson as persistLessonRequest } from '@services/lessonService';
import type { Lesson, LessonPayload } from '@/types/lesson';
import type {
  AdminCourseModule,
  AdminModuleContent,
  AdminModuleContentType,
  CourseModuleClient,
} from '@/types/module';
import styles from './CourseModulesBuilder.module.css';

export interface CourseModulesBuilderProps {
  courseId: string;
  initialModules: AdminCourseModule[];
  client?: CourseModuleClient;
  createLesson?: (payload: LessonPayload) => Promise<Lesson>;
}

type BuilderStatus = 'idle' | 'saving' | 'success' | 'error';

const sortModulesByOrder = (modules: AdminCourseModule[]) =>
  [...modules].sort((current, next) => current.order - next.order);

/**
 * O `order` do servidor pode ter lacunas após remoções. A numeração exibida
 * ("Módulo 1", "Módulo 2"…) usa sempre o índice do array, e aqui só ajustamos
 * o `order` local para manter a ordenação estável enquanto a API não responde.
 */
const reindexModules = (modules: AdminCourseModule[]) =>
  modules.map((module, index) => ({
    ...module,
    order: index + 1,
  }));

const formatModuleDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
};

const formatContentsCount = (total: number) => (total === 1 ? '1 aula' : `${total} aulas`);

const mapLessonToModuleContent = (lesson: Lesson, fallbackOrder: number): AdminModuleContent => ({
  id: lesson.id,
  title: lesson.title,
  type: lesson.type.toUpperCase() as AdminModuleContentType,
  order: lesson.order ?? fallbackOrder,
  durationMinutes:
    lesson.durationInSeconds != null ? Math.round(lesson.durationInSeconds / 60) : undefined,
});

const appendLessonToModule = (module: AdminCourseModule, lesson: Lesson): AdminCourseModule => {
  const content = mapLessonToModuleContent(lesson, module.contents.length + 1);
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
  const [moduleToDelete, setModuleToDelete] = useState<AdminCourseModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      // O servidor calcula a posição: o módulo novo entra sempre no fim.
      const createdModule = await client.createModule(courseId, title);

      setModules((currentModules) => [...currentModules, createdModule]);
      savedTitlesRef.current.set(createdModule.id, createdModule.title);
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
    nextModules: AdminCourseModule[],
    previousModules: AdminCourseModule[],
  ) => {
    // O reorder é tudo ou nada: enviamos a lista completa de IDs na ordem exibida.
    const moduleIds = nextModules.map((module) => module.id);

    setModules(reindexModules(nextModules));
    setFeedback('saving', 'Salvando nova ordem dos módulos...');

    try {
      // O servidor devolve a lista já com `order` reatribuído de 1 a n.
      const reorderedModules = await client.reorderModules(courseId, moduleIds);

      setModules(sortModulesByOrder(reorderedModules));
      setFeedback('success', 'Ordem dos módulos salva.');
    } catch (error) {
      // Em 400 nada foi alterado no servidor: voltamos à ordem anterior.
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

  const requestDeleteModule = (moduleId: string) => {
    const module = modules.find((current) => current.id === moduleId);

    if (module) {
      setModuleToDelete(module);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && !isDeleting) {
      setModuleToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!moduleToDelete) {
      return;
    }

    const moduleId = moduleToDelete.id;

    setIsDeleting(true);
    setFeedback('saving', 'Excluindo módulo...');

    try {
      // A remoção cascateia para todos os conteúdos e é irreversível;
      // por isso só atualizamos a lista depois do 204.
      await client.deleteModule(moduleId);

      setModules((currentModules) => currentModules.filter((module) => module.id !== moduleId));
      setExpandedModuleIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(moduleId);
        return nextIds;
      });
      savedTitlesRef.current.delete(moduleId);
      setModuleToDelete(null);
      setFeedback('success', 'Módulo excluído.');
    } catch (error) {
      // Fecha o diálogo para a mensagem de erro ficar visível na tela.
      setModuleToDelete(null);
      setFeedback(
        'error',
        error instanceof Error ? error.message : 'Não foi possível excluir o módulo.',
      );
    } finally {
      setIsDeleting(false);
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

  const deleteDescription = moduleToDelete
    ? `Esta ação excluirá o módulo “${moduleToDelete.title}” e ${formatContentsCount(
        moduleToDelete.totalContents,
      )} vinculada${moduleToDelete.totalContents === 1 ? '' : 's'} a ele. Não é possível desfazer.`
    : '';

  return (
    <section className={styles.builder} aria-label="Estrutura de conteúdo do curso">
      {statusMessage ? (
        <p className={styles.statusMessage} data-status={status} role="status">
          {statusMessage}
        </p>
      ) : null}

      {orderedModules.length === 0 ? (
        <p className={styles.emptyLessons}>
          Este curso ainda não tem módulos. Adicione o primeiro para começar a organizar o conteúdo.
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
                      <p>{`${formatContentsCount(module.totalContents)} · ${formatModuleDuration(
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
                      onClick={() => requestDeleteModule(module.id)}
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

      <ConfirmDialog
        open={moduleToDelete !== null}
        title="Excluir módulo?"
        description={deleteDescription}
        confirmLabel="Excluir módulo"
        isConfirming={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onOpenChange={handleDeleteDialogChange}
      />

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
