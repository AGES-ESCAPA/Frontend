/**
 * types/lesson.ts
 *
 * Tipos compartilhados do domínio de aulas (US-07 — videoaulas e
 * US-13 — anexo de textos e links).
 */

/** Formato principal do conteúdo da aula. */
export type LessonType = 'video' | 'text' | 'file';

/** Natureza de um material complementar anexado à aula. */
export type LessonResourceType = 'link' | 'file';

/** Material complementar: artigo/postagem externa ou PDF/planilha de apoio. */
export interface LessonResource {
  id: string;
  type: LessonResourceType;
  title: string;
  url: string;
}

/** Campos de conteúdo comuns à aula persistida e ao payload enviado à API. */
export interface LessonContent {
  title: string;
  description: string;
  type: LessonType;
  /** Preenchido apenas quando `type` é `video`. */
  videoUrl: string | null;
  durationInSeconds: number | null;
  /** Preenchido apenas quando `type` é `text`. */
  textContent: string | null;
  /** Preenchido apenas quando `type` é `file`. */
  fileUrl: string | null;
  /** Libera a aula para quem não está matriculado no curso. */
  isFreeSample: boolean;
  resources: LessonResource[];
}

/** Aula como devolvida pela API. */
export interface LessonAttachmentUpload {
  /** `id` do recurso ao qual o arquivo pertence; ausente para o arquivo da aula. */
  resourceId?: string;
  file: File;
}

export interface Lesson extends LessonContent {
  id: string;
  moduleId: string;
  order?: number;
}

/** Conjunto de dados enviado à API ao criar ou editar uma aula. */
export interface LessonPayload extends LessonContent {
  moduleId: string;
  /**
   * Arquivos escolhidos no navegador que ainda não foram enviados. A API
   * responde com as URLs definitivas, que substituem `fileUrl`/`resource.url`.
   */
  uploads: LessonAttachmentUpload[];
}
