/**
 * types/module.ts
 *
 * Tipos do domínio administrativo de módulos (US-06 — organização dos
 * módulos de um curso). Espelham o contrato de `/api/v1/admin/.../modules`.
 *
 * Não confundir com `CourseModule` de `types/course.ts`, que é o modelo da
 * página pública de detalhes do curso.
 */

export type AdminModuleContentType = 'VIDEO' | 'TEXT' | 'FILE';

/** Recorte de um conteúdo tal como vem na listagem de módulos. */
export interface AdminModuleContent {
  id: string;
  title: string;
  type: AdminModuleContentType;
  order: number;
  /** Só existe localmente, após criar uma aula; a API não devolve na listagem. */
  durationMinutes?: number;
}

export interface AdminCourseModule {
  id: string;
  title: string;
  /** Posição no curso definida pelo servidor. Pode ter lacunas após remoções. */
  order: number;
  /** Igual a `contents.length`. */
  totalContents: number;
  /** Soma de `durationMinutes` dos conteúdos; TEXT/FILE sem duração contam 0. */
  totalDurationMinutes: number;
  /** Já ordenados por `order`. */
  contents: AdminModuleContent[];
}

/** Contrato consumido pela tela de organização dos módulos. */
export interface CourseModuleClient {
  listModules(courseId: string): Promise<AdminCourseModule[]>;
  createModule(courseId: string, title: string): Promise<AdminCourseModule>;
  updateModuleTitle(moduleId: string, title: string): Promise<AdminCourseModule>;
  /** Devolve a lista completa já na nova ordem, com `order` reatribuído de 1 a n. */
  reorderModules(courseId: string, moduleIds: string[]): Promise<AdminCourseModule[]>;
  deleteModule(moduleId: string): Promise<void>;
}
