const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type CourseContentType = 'VIDEO' | 'TEXT' | 'FILE' | 'DOCUMENT' | 'QUIZ';

export interface CourseContent {
  id: number;
  title: string;
  type: CourseContentType;
  order: number;
  durationMinutes?: number;
}

export interface CourseModule {
  id: number;
  title: string;
  order: number;
  totalContents: number;
  totalDurationMinutes: number;
  contents: CourseContent[];
}

export interface CourseModuleClient {
  listModules(courseId: string): Promise<CourseModule[]>;
  createModule(courseId: string, title: string): Promise<CourseModule>;
  updateModuleTitle(moduleId: number, title: string): Promise<CourseModule>;
  reorderModules(courseId: string, moduleIds: number[]): Promise<void>;
  deleteModule(moduleId: number): Promise<void>;
}

const requestJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      typeof errorData?.message === 'string'
        ? errorData.message
        : `Request failed: ${response.statusText}`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const courseModulesApi: CourseModuleClient = {
  async listModules(courseId) {
    return requestJson<CourseModule[]>(`${API_BASE_URL}/admin/courses/${courseId}/modules`);
  },

  async createModule(courseId, title) {
    return requestJson<CourseModule>(`${API_BASE_URL}/admin/courses/${courseId}/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
  },

  async updateModuleTitle(moduleId, title) {
    return requestJson<CourseModule>(`${API_BASE_URL}/admin/modules/${moduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
  },

  async reorderModules(courseId, moduleIds) {
    await requestJson<void>(`${API_BASE_URL}/admin/courses/${courseId}/modules/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleIds }),
    });
  },

  async deleteModule(moduleId) {
    await requestJson<void>(`${API_BASE_URL}/admin/modules/${moduleId}`, {
      method: 'DELETE',
    });
  },
};
