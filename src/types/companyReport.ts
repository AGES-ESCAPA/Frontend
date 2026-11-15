export interface CompletionByJobTitle {
  jobTitle: string;
  completionRate: number;
}

export interface MonthlyHours {
  month: string;
  averageHours: number;
}

/** Resposta de `GET /api/v1/company/reports/overview` (AGES-ESCAPA/Backend#92). */
export interface CompanyReportOverview {
  completionRate: number;
  completionRateChange: number;
  averageHoursPerEmployee: number;
  certificatesThisQuarter: number;
  weeklyEngagement: number;
  /**
   * Pode não vir da API: só o último acesso fica gravado, então nem sempre há a semana anterior
   * para comparar. Sem ele, o card de engajamento aparece sem variação.
   */
  weeklyEngagementChange?: number;
  /** Em ordem alfabética do cargo. */
  completionByJobTitle: CompletionByJobTitle[];
  /** Sempre os 6 últimos meses, do mais antigo ao atual. */
  monthlyHours: MonthlyHours[];
}

export type EmployeeProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

/**
 * Uma linha de `GET /api/v1/company/reports/employees`: um colaborador em um curso. O mesmo
 * colaborador aparece uma vez por curso, então a linha é identificada por `userId` e `courseId`.
 */
export interface EmployeeProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  courseId: string;
  course: string;
  progress: number;
  /** `LocalDateTime` sem fuso; nulo quando o colaborador nunca abriu uma aula do curso. */
  lastAccessAt: string | null;
  certificateIssued: boolean;
}

/** Busca pelo nome do colaborador e filtro pela situação do curso, aplicados pelo backend. */
export interface EmployeeProgressFilters {
  search: string;
  status: EmployeeProgressStatus | null;
}

/** `PageResponse` do backend com as linhas do acompanhamento. */
export interface EmployeeProgressPage {
  content: EmployeeProgress[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
