import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CourseModulesBuilder } from './CourseModulesBuilder';
import type { CourseModule, CourseModuleClient } from '@services/courseModules';

const COURSE_ID = '00000000-0000-4000-8000-000000000001';
const FIRST_MODULE_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_MODULE_ID = '22222222-2222-4222-8222-222222222222';
const THIRD_MODULE_ID = '33333333-3333-4333-8333-333333333333';

const createModules = (): CourseModule[] => [
  {
    id: FIRST_MODULE_ID,
    title: 'Fundamentos do atendimento turístico',
    order: 1,
    totalContents: 2,
    totalDurationMinutes: 45,
    contents: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        title: 'Boas-vindas e objetivos do curso',
        type: 'VIDEO',
        order: 1,
      },
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
        title: 'Mapa da jornada do cliente',
        type: 'TEXT',
        order: 2,
      },
    ],
  },
  {
    id: SECOND_MODULE_ID,
    title: 'Hospitalidade aplicada na prática',
    order: 2,
    totalContents: 1,
    totalDurationMinutes: 30,
    contents: [
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        title: 'Protocolos de experiência premium',
        type: 'FILE',
        order: 1,
      },
    ],
  },
];

const createClient = (): CourseModuleClient => ({
  listModules: vi.fn(),
  createModule: vi.fn().mockResolvedValue({
    id: THIRD_MODULE_ID,
    title: 'Novo módulo 3',
    order: 3,
    totalContents: 0,
    totalDurationMinutes: 0,
    contents: [],
  }),
  updateModuleTitle: vi.fn().mockImplementation((moduleId: string, title: string) =>
    Promise.resolve({
      id: moduleId,
      title,
      order: 1,
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
    <CourseModulesBuilder courseId={COURSE_ID} initialModules={createModules()} client={client} />,
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
      expect(client.createModule).toHaveBeenCalledWith(COURSE_ID, 'Novo módulo 3');
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
      expect(client.updateModuleTitle).toHaveBeenCalledWith(
        FIRST_MODULE_ID,
        'Fundamentos revisados',
      );
    });
  });

  it('should reorder modules and persist the new order', async () => {
    const client = renderBuilder();
    const moduleCards = screen.getAllByRole('listitem');

    fireEvent.dragStart(moduleCards[1]);
    fireEvent.dragOver(moduleCards[0]);
    fireEvent.drop(moduleCards[0]);

    await waitFor(() => {
      expect(client.reorderModules).toHaveBeenCalledWith(COURSE_ID, [
        SECOND_MODULE_ID,
        FIRST_MODULE_ID,
      ]);
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
      expect(client.deleteModule).toHaveBeenCalledWith(FIRST_MODULE_ID);
    });
    expect(
      screen.queryByDisplayValue('Fundamentos do atendimento turístico'),
    ).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
