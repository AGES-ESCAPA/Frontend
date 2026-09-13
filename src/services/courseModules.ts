/**
 * services/courseModules.ts
 *
 * Comunicação com a API administrativa de módulos (US-06). A tela nunca chama
 * `fetch` diretamente: ela consome `courseModulesApi` (ou um `CourseModuleClient`
 * injetado nos testes).
 */
import { adminHeaders, readApiErrorMessage } from '@services/api';
import type { ApiResponse } from '@services/api';
import type { AdminCourseModule, CourseModuleClient } from '@/types/module';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ADMIN_URL = `${API_BASE_URL}/admin`;

const modulesUrl = (courseId: string) => `${ADMIN_URL}/courses/${courseId}/modules`;

const moduleUrl = (moduleId: string) => `${ADMIN_URL}/modules/${moduleId}`;

const requestJson = async <T>(url: string, fallback: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: adminHeaders() });

  if (!response.ok) {
    throw new Error((await readApiErrorMessage(response)) ?? fallback);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
};

const requestNoContent = async (url: string, fallback: string, init?: RequestInit) => {
  const response = await fetch(url, { ...init, headers: adminHeaders() });

  if (!response.ok) {
    throw new Error((await readApiErrorMessage(response)) ?? fallback);
  }
};

export const courseModulesApi: CourseModuleClient = {
  async listModules(courseId) {
    return requestJson<AdminCourseModule[]>(
      modulesUrl(courseId),
      'Não foi possível carregar os módulos do curso.',
    );
  },

  async createModule(courseId, title) {
    return requestJson<AdminCourseModule>(
      modulesUrl(courseId),
      'Não foi possível criar o módulo.',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      },
    );
  },

  async updateModuleTitle(moduleId, title) {
    return requestJson<AdminCourseModule>(
      moduleUrl(moduleId),
      'Não foi possível salvar o título do módulo.',
      {
        method: 'PUT',
        body: JSON.stringify({ title }),
      },
    );
  },

  async reorderModules(courseId, moduleIds) {
    return requestJson<AdminCourseModule[]>(
      `${modulesUrl(courseId)}/reorder`,
      'Não foi possível salvar a ordem dos módulos.',
      {
        method: 'PUT',
        body: JSON.stringify({ moduleIds }),
      },
    );
  },

  async deleteModule(moduleId) {
    await requestNoContent(moduleUrl(moduleId), 'Não foi possível excluir o módulo.', {
      method: 'DELETE',
    });
  },
};
