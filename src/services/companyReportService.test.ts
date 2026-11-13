import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyReportOverview, EmployeeProgressPage } from '@/types/companyReport';
import {
  CompanyReportServiceError,
  EMPLOYEE_PROGRESS_PAGE_SIZE,
  companyReportService,
} from './companyReportService';

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

const REPORTS_URL = 'http://localhost:8080/api/v1/company/reports';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const overview: CompanyReportOverview = {
  completionRate: 78.4,
  completionRateChange: 5.2,
  averageHoursPerEmployee: 12.6,
  certificatesThisQuarter: 14,
  weeklyEngagement: 89,
  weeklyEngagementChange: 2.1,
  completionByJobTitle: [{ jobTitle: 'Recepção', completionRate: 92 }],
  monthlyHours: [{ month: '2026-06', averageHours: 1 }],
};

const page: EmployeeProgressPage = {
  content: [
    {
      userId: 'user-1',
      name: 'Ana Silva',
      avatarUrl: null,
      courseId: 'course-1',
      course: 'Compliance',
      progress: 100,
      lastAccessAt: '2026-11-09T09:15:00',
      certificateIssued: true,
    },
  ],
  pageNumber: 0,
  pageSize: EMPLOYEE_PROGRESS_PAGE_SIZE,
  totalElements: 1,
  totalPages: 1,
};

const requestedUrl = (): URL => new URL(String(fetchMock.mock.calls[0][0]));

describe('companyReportService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe('getOverview', () => {
    it('fetches the overview of the token company with the bearer token and the signal', async () => {
      localStorage.setItem('access_token', 'token-123');
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: overview }));
      const { signal } = new AbortController();

      await expect(companyReportService.getOverview(signal)).resolves.toEqual(overview);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${REPORTS_URL}/overview`);
      expect(init?.signal).toBe(signal);
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-123');
    });

    it('accepts an overview without the weekly engagement variation', async () => {
      const withoutChange: CompanyReportOverview = { ...overview };
      delete withoutChange.weeklyEngagementChange;
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: withoutChange }));

      await expect(companyReportService.getOverview()).resolves.toEqual(withoutChange);
    });

    it('hides the technical message of a 404 behind the block message', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          { status: 404, message: 'Resource not found: /api/v1/company/reports/overview' },
          404,
        ),
      );

      await expect(companyReportService.getOverview()).rejects.toMatchObject({
        name: 'CompanyReportServiceError',
        status: 404,
        message:
          'Não foi possível carregar os indicadores da equipe. Tente novamente em instantes.',
      });
    });

    it.each([
      [401, 'Sua sessão expirou. Entre novamente para ver o relatório da equipe.'],
      [403, 'Você não tem permissão para ver o relatório desta empresa.'],
      [502, 'Não foi possível carregar os indicadores da equipe. Tente novamente em instantes.'],
    ])('shows a friendly message for the status %d', async (status, message) => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ status, message: 'Technical message from the server' }, status),
      );

      await expect(companyReportService.getOverview()).rejects.toMatchObject({ status, message });
    });

    it('passes on the API message of a validation error', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ status: 400, message: 'O status informado é inválido.' }, 400),
      );

      await expect(companyReportService.getOverview()).rejects.toMatchObject({
        status: 400,
        message: 'O status informado é inválido.',
      });
    });

    it('reports a network failure with status 0', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const error = await companyReportService.getOverview().catch((reason: unknown) => reason);

      expect(error).toBeInstanceOf(CompanyReportServiceError);
      expect(error).toMatchObject({
        status: 0,
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      });
    });

    it('rethrows the abort instead of turning it into a network error', async () => {
      const controller = new AbortController();
      controller.abort();
      const abortError = new DOMException('Aborted', 'AbortError');
      fetchMock.mockRejectedValueOnce(abortError);

      await expect(companyReportService.getOverview(controller.signal)).rejects.toBe(abortError);
    });

    it.each([
      ['a body that is not JSON', new Response('<html>', { status: 200 })],
      ['an envelope without success', jsonResponse({ success: false, data: overview })],
      [
        'a data missing indicators',
        jsonResponse({ success: true, data: { ...overview, completionRate: '78,4' } }),
      ],
      [
        'a monthly series with a broken item',
        jsonResponse({ success: true, data: { ...overview, monthlyHours: [{ month: 6 }] } }),
      ],
    ])('rejects %s as an invalid response', async (_case, response) => {
      fetchMock.mockResolvedValueOnce(response);

      await expect(companyReportService.getOverview()).rejects.toMatchObject({
        message: 'O servidor retornou uma resposta inválida.',
      });
    });
  });

  describe('listEmployeeProgress', () => {
    it('sends only the page and size when there is no search or status', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: page }));

      await expect(
        companyReportService.listEmployeeProgress({ search: '   ', status: null }),
      ).resolves.toEqual(page);

      const url = requestedUrl();
      expect(`${url.origin}${url.pathname}`).toBe(`${REPORTS_URL}/employees`);
      expect(Object.fromEntries(url.searchParams)).toEqual({
        page: '0',
        size: String(EMPLOYEE_PROGRESS_PAGE_SIZE),
      });
    });

    it('sends the trimmed search, the status and the requested page', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: page }));
      const { signal } = new AbortController();

      await companyReportService.listEmployeeProgress(
        { search: '  João ', status: 'COMPLETED' },
        2,
        signal,
      );

      expect(Object.fromEntries(requestedUrl().searchParams)).toEqual({
        search: 'João',
        status: 'COMPLETED',
        page: '2',
        size: String(EMPLOYEE_PROGRESS_PAGE_SIZE),
      });
      expect(fetchMock.mock.calls[0][1]?.signal).toBe(signal);
    });

    it('uses its own fallback message on an error without body', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

      await expect(
        companyReportService.listEmployeeProgress({ search: '', status: null }),
      ).rejects.toMatchObject({
        status: 500,
        message:
          'Não foi possível carregar o acompanhamento dos colaboradores. Tente novamente em instantes.',
      });
    });

    it('rejects a page whose row misses the certificate flag', async () => {
      const brokenRow: Partial<EmployeeProgressPage['content'][number]> = { ...page.content[0] };
      delete brokenRow.certificateIssued;
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ success: true, data: { ...page, content: [brokenRow] } }),
      );

      await expect(
        companyReportService.listEmployeeProgress({ search: '', status: null }),
      ).rejects.toMatchObject({ message: 'O servidor retornou uma resposta inválida.' });
    });
  });
});
