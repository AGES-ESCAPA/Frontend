import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CourseModulesBuilder } from './CourseModulesBuilder';
import type { CourseModule, CourseModuleClient } from '@services/courseModules';

const createModules = (): CourseModule[] => [
  {
    id: 1,
    title: 'Fundamentos do atendimento turístico',
    order: 1,
    totalContents: 2,
    totalDurationMinutes: 45,
    contents: [
      { id: 101, title: 'Boas-vindas e objetivos do curso', type: 'VIDEO', order: 1 },
      { id: 102, title: 'Mapa da jornada do cliente', type: 'TEXT', order: 2 },
    ],
  },
  {
    id: 2,
    title: 'Hospitalidade aplicada na prática',
    order: 2,
    totalContents: 1,
    totalDurationMinutes: 30,
    contents: [{ id: 201, title: 'Protocolos de experiência premium', type: 'FILE', order: 1 }],
  },
];

const createClient = (): CourseModuleClient => ({
  listModules: vi.fn(),
  createModule: vi.fn().mockResolvedValue({
    id: 3,
    title: 'Novo módulo 3',
    order: 3,
    totalContents: 0,
    totalDurationMinutes: 0,
    contents: [],
  }),
  updateModuleTitle: vi.fn().mockImplementation((moduleId: number, title: string) =>
    Promise.resolve({
      id: moduleId,
      title,
      order: moduleId,
      totalContents: 0,
      totalDurationMinutes: 0,
      contents: [],
    }),
  ),
  reorderModules: vi.fn().mockResolvedValue(undefined),
  deleteModule: vi.fn().mockResolvedValue(undefined),
});

const renderBuilder = (client = createClient()) => {
  render(
    <CourseModulesBuilder courseId="course-1" initialModules={createModules()} client={client} />,
  );
  return client;
};

describe('CourseModulesBuilder', () => {
  it('should list modules with sequential labels', () => {
    renderBuilder();

    expect(screen.getByText('Módulo 1:')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fundamentos do atendimento turístico')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hospitalidade aplicada na prática')).toBeInTheDocument();
  });

  it('should expand and collapse linked lessons', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: /expandir módulo 1/i }));

    expect(screen.getByText('Boas-vindas e objetivos do curso')).toBeInTheDocument();
    expect(screen.getByText('Mapa da jornada do cliente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /recolher módulo 1/i }));

    expect(screen.queryByText('Boas-vindas e objetivos do curso')).not.toBeInTheDocument();
  });

  it('should create a new module', async () => {
    const user = userEvent.setup();
    const client = renderBuilder();

    await user.click(screen.getByRole('button', { name: /\+ adicionar módulo/i }));

    await waitFor(() => {
      expect(client.createModule).toHaveBeenCalledWith('course-1', 'Novo módulo 3');
    });
    expect(await screen.findByDisplayValue('Novo módulo 3')).toBeInTheDocument();
  });

  it('should update a module title through direct editing', async () => {
    const user = userEvent.setup();
    const client = renderBuilder();
    const titleFields = screen.getAllByLabelText(/título do módulo/i);

    await user.clear(titleFields[0]);
    await user.type(titleFields[0], 'Fundamentos revisados');
    await user.tab();

    await waitFor(() => {
      expect(client.updateModuleTitle).toHaveBeenCalledWith(1, 'Fundamentos revisados');
    });
  });

  it('should reorder modules and persist the new order', async () => {
    const client = renderBuilder();
    const moduleCards = screen.getAllByRole('listitem');

    fireEvent.dragStart(moduleCards[1]);
    fireEvent.dragOver(moduleCards[0]);
    fireEvent.drop(moduleCards[0]);

    await waitFor(() => {
      expect(client.reorderModules).toHaveBeenCalledWith('course-1', [2, 1]);
    });

    const reorderedModuleCards = screen.getAllByRole('listitem');
    expect(
      within(reorderedModuleCards[0]).getByDisplayValue('Hospitalidade aplicada na prática'),
    ).toBeInTheDocument();
  });

  it('should delete a module after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const client = renderBuilder();

    await user.click(screen.getByRole('button', { name: /excluir módulo 1/i }));

    await waitFor(() => {
      expect(client.deleteModule).toHaveBeenCalledWith(1);
    });
    expect(
      screen.queryByDisplayValue('Fundamentos do atendimento turístico'),
    ).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
