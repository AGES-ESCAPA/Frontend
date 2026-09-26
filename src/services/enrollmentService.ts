import { api, studentHeaders } from './api';
import type { ApiResponse } from './api';
import type { EnrollmentStatus } from '../components/ui/StudentCourseCard';

export interface StudentCourseCardResponse {
  courseId: string;
  title: string;
  instructor: string | null;
  thumbnailUrl: string | null;
  durationTime: number | null;
  lessonsCount: number;
  progressPercentage: number | null;
  enrollmentStatus: EnrollmentStatus;
}

export interface PageResult<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface GetEnrollmentsParams {
  query?: string;
  status?: EnrollmentStatus;
  page?: number;
  size?: number;
}

export const getStudentEnrollments = async (
  params: GetEnrollmentsParams = {},
): Promise<PageResult<StudentCourseCardResponse>> => {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.status) searchParams.append('status', params.status);
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.size !== undefined) searchParams.append('size', params.size.toString());

  const queryString = searchParams.toString();
  const url = `${api.baseUrl}/student/enrollments${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: studentHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar matrículas: ${response.statusText}`);
  }

  const json: ApiResponse<PageResult<StudentCourseCardResponse>> = await response.json();
  return json.data;
};
