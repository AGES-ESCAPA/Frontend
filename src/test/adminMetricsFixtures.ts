import type { AdminMetricsOverview } from '@/types/adminMetrics';

export const adminMetricsOverview: AdminMetricsOverview = {
  activeStudents: 12847,
  partnerCompanies: 1532,
  averageCompletionRate: 68,
  activeStudentsByMonth: [
    { month: '2026-06', activeStudents: 9500 },
    { month: '2026-07', activeStudents: 0 },
    { month: '2026-08', activeStudents: 11230 },
    { month: '2026-09', activeStudents: 12001 },
    { month: '2026-10', activeStudents: 12700 },
    { month: '2026-11', activeStudents: 13001 },
  ],
};

export const zeroAdminMetricsOverview: AdminMetricsOverview = {
  activeStudents: 0,
  partnerCompanies: 0,
  averageCompletionRate: 0,
  activeStudentsByMonth: adminMetricsOverview.activeStudentsByMonth.map(({ month }) => ({
    month,
    activeStudents: 0,
  })),
};
