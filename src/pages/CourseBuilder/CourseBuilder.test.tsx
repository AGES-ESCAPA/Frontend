import { render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@contexts/authContextDefinition';
import type { AuthContextValue } from '@contexts/authContextDefinition';
import {
  addCoursePrerequisite,
  createCourse,
  getCourseById,
  getCourseRules,
  listCourseCategories,
  publishCourse,
  removeCoursePrerequisite,
  searchCoursePrerequisites,
  updateCourse,
  updateProgressRules,
  uploadCourseThumbnail,
} from '@services/courseService';
import { courseModulesApi } from '@services/courseModules';
import type { CourseDetail, CourseRules } from '@/types/course';
import type { AdminCourseModule } from '@/types/module';
import { CourseBuilder } from './CourseBuilder';

vi.mock('@services/courseService', () => ({
  createCourse: vi.fn(),
  getCourseById: vi.fn(),
  updateCourse: vi.fn(),
  publishCourse: vi.fn(),
  listCourseCategories: vi.fn(),
  uploadCourseThumbnail: vi.fn(),
  getCourseRules: vi.fn(),
  updateProgressRules: vi.fn(),
  searchCoursePrerequisites: vi.fn(),
  addCoursePrerequisite: vi.fn(),
  removeCoursePrerequisite: vi.fn(),
}));

vi.mock('@services/courseModules', () => ({
  courseModulesApi: {
    listModules: vi.fn(),
    createModule: vi.fn(),
    updateModuleTitle: vi.fn(),
    reorderModules: vi.fn(),
    deleteModule: vi.fn(),
  },
}));

const SAVED_MODULES: AdminCourseModule[] = [
  {
    id: '01000000-0000-4000-9000-000000000001',
    title: 'Fundamentos do Atendimento',
    order: 1,
    totalContents: 0,
    totalDurationMinutes: 0,
    contents: [],
  },
];

const SAVED_COURSE: CourseDetail = {
  id: 'c2f1b3a4-0000-4000-8000-000000000001',
  title: 'Fundamentos de Design de Interfaces Corporativas',
  category: 'Design & UX',
  level: 'INICIANTE',
  description: 'Descrição completa do curso.',
  shortDescription: 'Ementa resumida do curso.',
  teaserVideoUrl: 'https://youtube.com/watch?v=aaaaaaaaaaa',
  thumbnailUrl: 'https://cdn.escapa.com/courses/capa.jpg',
  durationTime: 40,
  deadline: 365,
  price: 499,
  status: 'DRAFT',
};

const LOGGED_ADMIN_ID = 'a1b2c3d4-0000-4000-8000-000000000099';

const EMPTY_RULES: CourseRules = {
  requireSequentialProgress: true,
  enforceDeadlineBlock: false,
  version: '0.0',
  prerequisites: [],
  changeLog: [],
};

const AUTH_CONTEXT: AuthContextValue = {
  user: {
    id: LOGGED_ADMIN_ID,
    name: 'Admin',
    email: 'admin@escapa.com',
    role: 'ADMIN',
  },
  isAuthenticated: true,
  isRestoring: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
};

const renderBuilder = (path = '/admin/cursos/novo'): RenderResult =>
  render(
    <AuthContext.Provider value={AUTH_CONTEXT}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/cursos/novo" element={<CourseBuilder />} />
          <Route path="/admin/cursos/:id/editar" element={<CourseBuilder />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('CourseBuilder', () => {
  beforeEach(() => {
    vi.mocked(createCourse).mockReset().mockResolvedValue(SAVED_COURSE);
    vi.mocked(updateCourse).mockReset().mockResolvedValue(SAVED_COURSE);
    vi.mocked(publishCourse)
      .mockReset()
      .mockResolvedValue({ ...SAVED_COURSE, status: 'PUBLISHED' });
    vi.mocked(getCourseById).mockReset().mockResolvedValue(SAVED_COURSE);
    vi.mocked(listCourseCategories)
      .mockReset()
      .mockResolvedValue(['Design & UX', 'Hospitalidade', 'Marketing']);
    vi.mocked(uploadCourseThumbnail).mockReset();
    vi.mocked(getCourseRules).mockReset().mockResolvedValue(EMPTY_RULES);
    vi.mocked(updateProgressRules).mockReset().mockResolvedValue(EMPTY_RULES);
    vi.mocked(searchCoursePrerequisites).mockReset().mockResolvedValue([]);
    vi.mocked(addCoursePrerequisite).mockReset().mockResolvedValue(undefined);
    vi.mocked(removeCoursePrerequisite).mockReset().mockResolvedValue(undefined);
    vi.mocked(courseModulesApi.listModules).mockReset().mockResolvedValue(SAVED_MODULES);
  });

  const selectCategory = async (categoryName: string) => {
    await userEvent.click(screen.getByRole('combobox', { name: /categoria principal/i }));
    await userEvent.type(
      screen.getByRole('searchbox', { name: /buscar categoria/i }),
      categoryName,
    );
    const option = await screen.findByRole('option', {
      name: (accessibleName) =>
        accessibleName === categoryName || accessibleName === `Criar categoria "${categoryName}"`,
    });
    await userEvent.click(option);
  };

  const fillRequiredFieldsForPublish = async (categoryName = 'Hospitalidade') => {
    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.type(
      screen.getByRole('textbox', { name: /resumo curto/i }),
      'Ementa resumida.',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /descrição completa/i }),
      'Descrição completa do curso.',
    );
    await selectCategory(categoryName);
    await userEvent.click(screen.getByRole('button', { name: 'Iniciante' }));
    await userEvent.type(screen.getByRole('textbox', { name: /carga horária/i }), '40');
    await userEvent.type(screen.getByRole('textbox', { name: /preço base/i }), '199');
  };

  it('should render every field of the course registration form', () => {
    renderBuilder();

    expect(screen.getByLabelText(/imagem de capa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clique para enviar a capa/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /título/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /url vídeo teaser/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /resumo curto/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /descrição completa/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /categoria principal/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /carga horária/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /preço base/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /nível de dificuldade/i })).toBeInTheDocument();
  });

  it('should integrate the admin Sidebar with Course Management as the current section', () => {
    renderBuilder();

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — admin/i });
    const currentLink = screen.getByRole('link', { name: 'Gestão de Cursos' });

    expect(sidebar).toBeInTheDocument();
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  it('should show a required warning below each blank field when publishing', async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    expect(await screen.findAllByText('Preenchimento obrigatório.')).toHaveLength(5);
    expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('Selecione um nível de dificuldade.')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should reject zeroed or negative values on price and duration', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /carga horária/i }), '-8');
    await userEvent.type(screen.getByRole('textbox', { name: /preço base/i }), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    expect(await screen.findByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should reject zeroed or negative values on price and duration even when saving as a draft', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.type(screen.getByRole('textbox', { name: /carga horária/i }), '-8');
    await userEvent.type(screen.getByRole('textbox', { name: /preço base/i }), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    expect(await screen.findByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should reject a teaser link that is not a YouTube or Vimeo video', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /url vídeo teaser/i }), 'youtube.com');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    expect(
      await screen.findByText('Informe um link válido do YouTube ou Vimeo.'),
    ).toBeInTheDocument();
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('should submit the draft to the API and confirm it with a toast', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Curso de Recepção', status: 'DRAFT' }),
      );
    });

    expect(await screen.findByText('Rascunho salvo!')).toBeInTheDocument();
  });

  it('should keep the published version unchanged when saving a draft', async () => {
    vi.mocked(getCourseById).mockResolvedValue({ ...SAVED_COURSE, status: 'PUBLISHED' });
    vi.mocked(updateCourse).mockResolvedValue({
      ...SAVED_COURSE,
      status: 'PUBLISHED',
      title: 'Titulo em rascunho',
    });

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    const title = await screen.findByDisplayValue(SAVED_COURSE.title);
    await userEvent.clear(title);
    await userEvent.type(title, 'Titulo em rascunho');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(updateCourse).toHaveBeenCalledWith(
        SAVED_COURSE.id,
        expect.objectContaining({ title: 'Titulo em rascunho', status: 'DRAFT' }),
      );
    });
    expect(publishCourse).not.toHaveBeenCalled();
    expect(
      await screen.findByText('A versão que os alunos veem permanece até você publicar o curso.'),
    ).toBeInTheDocument();
  });

  it('should send the logged user id as instructor when creating a draft', async () => {
    renderBuilder();

    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', instructorId: LOGGED_ADMIN_ID }),
      );
    });
  });

  it('should save the course and then call the publish endpoint as a separate step', async () => {
    renderBuilder();

    await fillRequiredFieldsForPublish();
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalled();
    });
    expect(publishCourse).toHaveBeenCalledWith(SAVED_COURSE.id, {
      notifyEnrolledStudents: false,
    });
    expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Hospitalidade' }),
    );
    expect(await screen.findByText('Curso publicado com sucesso!')).toBeInTheDocument();
  });

  it('should publish a category created when the search does not match a registered one', async () => {
    renderBuilder();

    await fillRequiredFieldsForPublish('Enoturismo');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Enoturismo' }),
      );
    });
  });

  it('should show the API validation error and keep the course as a draft when publish is rejected', async () => {
    vi.mocked(publishCourse).mockRejectedValueOnce(
      new Error('Cannot publish course due to missing requirements: instructorId'),
    );
    renderBuilder();

    await fillRequiredFieldsForPublish();
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    expect(
      await screen.findByText('Cannot publish course due to missing requirements: instructorId'),
    ).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('should prefill the form with the stored course on the edit route', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);

    await waitFor(() => {
      expect(getCourseById).toHaveBeenCalledWith(SAVED_COURSE.id);
    });

    expect(await screen.findByDisplayValue(SAVED_COURSE.title)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /resumo curto/i })).toHaveValue(
      SAVED_COURSE.shortDescription,
    );
    expect(screen.getByRole('textbox', { name: /descrição completa/i })).toHaveValue(
      SAVED_COURSE.description,
    );
    expect(screen.getByRole('combobox', { name: /categoria principal/i })).toHaveTextContent(
      'Design & UX',
    );
    expect(screen.getByRole('textbox', { name: /carga horária/i })).toHaveValue('40');
    expect(screen.getByRole('textbox', { name: /prazo/i })).toHaveValue('365');
    expect(screen.getByRole('textbox', { name: /preço base/i })).toHaveValue('499,00');
    expect(screen.getByRole('button', { name: 'Iniciante' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('img', { name: /pré-visualização da capa do curso/i })).toHaveAttribute(
      'src',
      SAVED_COURSE.thumbnailUrl,
    );
  });

  it('should upload the cover and send its url when saving the draft', async () => {
    const coverUrl = 'https://cdn.escapa.com/courses/nova-capa.jpg';
    vi.mocked(uploadCourseThumbnail).mockResolvedValue(coverUrl);
    URL.createObjectURL = vi.fn(() => 'blob:capa');
    URL.revokeObjectURL = vi.fn();
    renderBuilder();

    const cover = new File(['capa'], 'capa.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText(/imagem de capa/i), cover);

    expect(
      await screen.findByRole('img', { name: /pré-visualização da capa do curso/i }),
    ).toHaveAttribute('src', coverUrl);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar Rascunho' })).toBeEnabled();
    });

    await userEvent.type(screen.getByRole('textbox', { name: /título/i }), 'Curso de Recepção');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Curso de Recepção', thumbnailUrl: coverUrl }),
      );
    });
  });

  it('should keep the fields disabled while the stored course is loading', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);

    expect(screen.getByRole('status')).toHaveTextContent(/carregando os dados do curso/i);
    expect(screen.getByRole('textbox', { name: /título/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /título/i })).toBeEnabled();
    });
  });
  it('should ask to save the draft before organizing modules on a new course', async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole('tab', { name: /estrutura de conteúdo/i }));

    expect(
      await screen.findByText(/salve o rascunho do curso para começar a organizar os módulos/i),
    ).toBeInTheDocument();
    expect(courseModulesApi.listModules).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /adicionar módulo/i })).not.toBeInTheDocument();
  });

  it('should load the stored modules on the edit route', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);

    await waitFor(() => {
      expect(courseModulesApi.listModules).toHaveBeenCalledWith(SAVED_COURSE.id);
    });

    await userEvent.click(screen.getByRole('tab', { name: /estrutura de conteúdo/i }));

    expect(await screen.findByDisplayValue('Fundamentos do Atendimento')).toBeInTheDocument();
  });

  it('should show the API error and retry loading the modules', async () => {
    vi.mocked(courseModulesApi.listModules)
      .mockRejectedValueOnce(new Error('Access denied: user is not ADMIN'))
      .mockResolvedValueOnce(SAVED_MODULES);

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await userEvent.click(screen.getByRole('tab', { name: /estrutura de conteúdo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied: user is not ADMIN');
    expect(screen.queryByDisplayValue('Fundamentos do Atendimento')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(await screen.findByDisplayValue('Fundamentos do Atendimento')).toBeInTheDocument();
    expect(courseModulesApi.listModules).toHaveBeenCalledTimes(2);
  });

  it('should keep a module created moments ago after switching tabs and coming back', async () => {
    vi.mocked(courseModulesApi.createModule).mockResolvedValueOnce({
      id: '01000000-0000-4000-9000-000000000002',
      title: 'Novo módulo 2',
      order: 2,
      totalContents: 0,
      totalDurationMinutes: 0,
      contents: [],
    });

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await userEvent.click(screen.getByRole('tab', { name: /estrutura de conteúdo/i }));
    await screen.findByDisplayValue('Fundamentos do Atendimento');

    await userEvent.click(screen.getByRole('button', { name: /adicionar módulo/i }));
    expect(await screen.findByDisplayValue('Novo módulo 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));
    await userEvent.click(screen.getByRole('tab', { name: /estrutura de conteúdo/i }));

    expect(await screen.findByDisplayValue('Novo módulo 2')).toBeInTheDocument();
    expect(courseModulesApi.listModules).toHaveBeenCalledTimes(1);
  });

  it('should ask to save the draft before configuring rules on a new course', async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));

    expect(
      await screen.findByText(/salve o rascunho do curso para configurar as regras/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Integração Corporativa N1')).not.toBeInTheDocument();
    expect(getCourseRules).not.toHaveBeenCalled();
  });

  it('should load prerequisites and the version history stored for the course', async () => {
    vi.mocked(getCourseRules).mockResolvedValue({
      requireSequentialProgress: false,
      enforceDeadlineBlock: true,
      version: '1.4',
      prerequisites: [{ courseId: 'pre-1', courseTitle: 'Segurança da Informação' }],
      changeLog: [
        {
          id: 'log-1',
          description: 'Versão 1.0 publicada.',
          changedBy: 'Admin Gestor',
          createdAt: '2023-10-05T16:40:00',
        },
      ],
    });

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));

    expect(await screen.findByText('Segurança da Informação')).toBeInTheDocument();
    expect(screen.getByText('V 1.4')).toBeInTheDocument();
    expect(screen.getByText('Versão 1.0 publicada.')).toBeInTheDocument();
    expect(screen.getByText('Por: Admin Gestor')).toBeInTheDocument();
    expect(screen.getByText(/5 de outubro de 2023/)).toBeInTheDocument();
    expect(screen.queryByText('Integração Corporativa N1')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /exigir conclusão/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /bloquear acesso/i })).toBeChecked();
  });

  it('should search courses and persist the chosen prerequisite', async () => {
    vi.mocked(searchCoursePrerequisites).mockResolvedValue([
      { id: 'pre-2', title: 'Gestão de Crises no Turismo' },
    ]);
    vi.mocked(getCourseRules)
      .mockResolvedValueOnce(EMPTY_RULES)
      .mockResolvedValueOnce({
        ...EMPTY_RULES,
        prerequisites: [{ courseId: 'pre-2', courseTitle: 'Gestão de Crises no Turismo' }],
        changeLog: [
          {
            id: 'log-2',
            description: 'Pré-requisito adicionado.',
            changedBy: 'Sistema',
            createdAt: '2026-10-31T19:00:00',
          },
        ],
      });

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await screen.findByDisplayValue(SAVED_COURSE.title);
    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));
    await screen.findByText('Nenhuma alteração registrada.');

    await userEvent.type(
      screen.getByRole('textbox', { name: /buscar cursos para adicionar/i }),
      'gestão',
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Gestão de Crises no Turismo' }),
    );

    expect(await screen.findByText('Gestão de Crises no Turismo')).toBeInTheDocument();
    expect(addCoursePrerequisite).not.toHaveBeenCalled();
    expect(screen.getByText('Nenhuma alteração registrada.')).toBeInTheDocument();
    expect(searchCoursePrerequisites).toHaveBeenCalledWith(SAVED_COURSE.id, 'gestão');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(addCoursePrerequisite).toHaveBeenCalledWith(SAVED_COURSE.id, 'pre-2');
    });
    expect(await screen.findByText('Pré-requisito adicionado.')).toBeInTheDocument();
  });

  it('should remove a prerequisite through the API', async () => {
    vi.mocked(getCourseRules)
      .mockResolvedValueOnce({
        ...EMPTY_RULES,
        prerequisites: [{ courseId: 'pre-1', courseTitle: 'Segurança da Informação' }],
      })
      .mockResolvedValueOnce(EMPTY_RULES);

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await screen.findByDisplayValue(SAVED_COURSE.title);
    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));
    await screen.findByText('Segurança da Informação');

    await userEvent.click(
      screen.getByRole('button', { name: /remover segurança da informação dos pré-requisitos/i }),
    );

    expect(screen.queryByText('Segurança da Informação')).not.toBeInTheDocument();
    expect(removeCoursePrerequisite).not.toHaveBeenCalled();
    expect(screen.getByText('V 0.0')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma alteração registrada.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(removeCoursePrerequisite).toHaveBeenCalledWith(SAVED_COURSE.id, 'pre-1');
    });
  });

  it('should persist a progress rule change only when the draft is saved', async () => {
    vi.mocked(getCourseRules)
      .mockResolvedValueOnce(EMPTY_RULES)
      .mockResolvedValueOnce({
        ...EMPTY_RULES,
        requireSequentialProgress: false,
        version: '0.1',
        changeLog: [
          {
            id: 'log-3',
            description: 'Alteração nas regras de progressão.',
            changedBy: 'Admin',
            createdAt: '2026-10-31T19:10:00',
          },
        ],
      });

    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await screen.findByDisplayValue(SAVED_COURSE.title);
    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));

    await userEvent.click(await screen.findByRole('checkbox', { name: /exigir conclusão/i }));

    expect(updateProgressRules).not.toHaveBeenCalled();
    expect(screen.getByText('V 0.0')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma alteração registrada.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Rascunho' }));

    await waitFor(() => {
      expect(updateProgressRules).toHaveBeenCalledWith(SAVED_COURSE.id, {
        requireSequentialProgress: false,
        enforceDeadlineBlock: false,
      });
    });
    expect(await screen.findByText('V 0.1')).toBeInTheDocument();
    expect(screen.getByText('Alteração nas regras de progressão.')).toBeInTheDocument();
  });

  it('should send the notify flag when publishing with the checkbox enabled', async () => {
    renderBuilder(`/admin/cursos/${SAVED_COURSE.id}/editar`);
    await screen.findByDisplayValue(SAVED_COURSE.title);
    await userEvent.click(screen.getByRole('tab', { name: /regras & pré requisitos/i }));
    await userEvent.click(
      await screen.findByRole('checkbox', { name: /notificar todos os alunos/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Curso' }));

    await waitFor(() => {
      expect(publishCourse).toHaveBeenCalledWith(SAVED_COURSE.id, {
        notifyEnrolledStudents: true,
      });
    });
  });
});
