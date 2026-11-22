/**
 * types/lesson.ts
 *
 * Tipos compartilhados do domínio de aulas (US-07 — videoaulas e
 * US-13 — anexo de textos e links).
 */

/** Formato principal do conteúdo da aula. `file` permanece só para aulas legadas. */
export type LessonType = 'video' | 'text' | 'file' | 'quiz';

/** Natureza de um material complementar anexado à aula. */
export type LessonResourceType = 'link' | 'file';

/** Material complementar: artigo/postagem externa ou PDF/planilha de apoio. */
export interface LessonResource {
  id: string;
  type: LessonResourceType;
  title: string;
  url: string;
}

/** Alternativa de quiz (admin inclui `correct`; aluno não recebe). */
export interface QuizOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

/** Pergunta no player do aluno (sem gabarito). */
export interface StudentQuizOption {
  id: string;
  text: string;
}

export interface StudentQuizQuestion {
  id: string;
  prompt: string;
  options: StudentQuizOption[];
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
  /** Preenchido apenas quando `type` é `file` (legado). */
  fileUrl: string | null;
  /** Preenchido quando `type` é `quiz` (admin vê gabarito). */
  quizQuestions: QuizQuestion[];
  /** Mínimo de acerto do curso; vem no GET da aula do aluno. */
  minQuizPassPercentage?: number;
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

/** Conjunto de dados enviado à API ao criar ou editar uma aula. */
export interface LessonPayload extends LessonContent {
  moduleId: string;
  /**
   * Arquivos escolhidos no navegador que ainda não foram enviados. A API
   * responde com as URLs definitivas, que substituem `fileUrl`/`resource.url`.
   */
  uploads: LessonAttachmentUpload[];
}

/** Referência externa citada no conteúdo da aula (US-12). */
export interface LessonReference {
  title: string;
  url: string;
  favicon?: string;
}

export interface Lesson extends LessonContent {
  id: string;
  moduleId: string;
  order?: number;
  module?: {
    id: string;
    title: string;
    order: number;
  };
  concepts?: string[];
  references?: LessonReference[];
  /** Perguntas sem gabarito no GET do aluno. */
  studentQuizQuestions?: StudentQuizQuestion[];
}
