export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CourseDifficulty = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

export interface CourseDifficultyOption {
  value: CourseDifficulty;
  label: string;
}

export const COURSE_DIFFICULTIES: readonly CourseDifficultyOption[] = [
  { value: 'INICIANTE', label: 'Iniciante' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
  { value: 'AVANCADO', label: 'Avançado' },
];

export const COURSE_CATEGORIES: readonly string[] = [
  'Design & UX',
  'Hospitalidade',
  'Turismo de Luxo',
  'Marketing',
  'Gestão & Liderança',
  'Inovação',
  'Inteligência Artificial',
];

/**
 * Valores da tela do Construtor de Curso. Todos os campos são strings porque
 * refletem exatamente o conteúdo dos inputs — a conversão para número acontece
 * na validação e na montagem do payload.
 */
export interface CourseFormValues {
  title: string;
  teaserVideoUrl: string;
  shortDescription: string;
  description: string;
  category: string;
  difficulty: string;
  durationTime: string;
  deadline: string;
  price: string;
}

export type CourseFormField = keyof CourseFormValues;

export type CourseFormErrors = Partial<Record<CourseFormField, string>>;

/** Rigor da validação: o rascunho exige apenas o título, a publicação exige tudo. */
export type CourseValidationMode = 'draft' | 'publish';

/** Corpo enviado ao endpoint administrativo de cursos (TSK-03-BACK). */
export interface CoursePayload {
  title: string;
  category: string | null;
  level: CourseDifficulty | null;
  description: string | null;
  shortDescription: string | null;
  teaserVideoUrl: string | null;
  durationTime: number | null;
  deadline: number | null;
  price: number | null;
  status: CourseStatus;
}

/** Curso retornado pelo backend ao abrir a rota de edição. */
export interface CourseDetail {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  description: string | null;
  shortDescription: string | null;
  teaserVideoUrl: string | null;
  durationTime: number | null;
  deadline: number | null;
  price: number | null;
  status: CourseStatus;
}

export type LessonType = 'video' | 'text' | 'quiz';

export interface CourseLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  isFree?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessonCount: number;
  totalMinutes: number;
  lessons: CourseLesson[];
}

/**
 * Regras de progresso do curso, exibidas na aba "Regras & Pré Requisitos".
 * O backend ainda não tem um endpoint para persistir isso (ver TSK-05-BACK);
 * por enquanto o Construtor de Curso mantém esse estado só localmente.
 */
export interface CourseProgressRules {
  requireSequentialProgress: boolean;
  blockAccessAfterDeadline: boolean;
}

/** Curso já concluído que passa a ser exigido como pré-requisito. */
export interface CoursePrerequisiteOption {
  id: string;
  title: string;
}

/** Entrada do histórico de versões do curso. */
export interface CourseVersionLogEntry {
  id: string;
  timestampLabel: string;
  description: string;
  author: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  accessPeriod: string;
  price: string;
  instructor: {
    name: string;
    role: string;
  };
  benefits: string[];
  teaserUrl: string;
  modules: CourseModule[];
}
