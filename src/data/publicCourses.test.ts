import { describe, expect, it } from 'vitest';
import { getMockPublicCoursesPage, mockPublicCourses } from './publicCourses';

describe('getMockPublicCoursesPage', () => {
  it('should return the first page of all mock courses', () => {
    const page = getMockPublicCoursesPage({ page: 0, size: 3 });

    expect(page.content).toHaveLength(3);
    expect(page.totalElements).toBe(mockPublicCourses.length);
    expect(page.pageSize).toBe(3);
  });

  it('should filter by category and level from the public route contract', () => {
    const page = getMockPublicCoursesPage({
      category: 'Inteligência Artificial',
      level: 'Iniciante',
    });

    expect(page.content).toHaveLength(1);
    expect(page.content[0].title).toBe('IA Aplicada ao Turismo');
  });

  it('should filter by title ignoring case', () => {
    const page = getMockPublicCoursesPage({ title: 'revenue' });

    expect(page.content).toHaveLength(1);
    expect(page.content[0].id).toBe('revenue-management-hotelaria');
  });
});
