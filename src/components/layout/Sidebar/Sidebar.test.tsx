import { render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { SidebarMenuItem, SidebarProps, SidebarRole, SidebarUser } from './Sidebar';
import { SIDEBAR_MENU_PRESETS } from './sidebarMenuPresets';

const student: SidebarUser = { name: 'Jorge Amado', role: 'Aluno' };

const customItems: SidebarMenuItem[] = [
  { icon: <BookOpen data-testid="icon-catalogo" />, label: 'Catálogo', route: '/catalogo' },
  { icon: <BookOpen />, label: 'Trilhas', route: '/trilhas', active: true },
];

// Os itens de menu usam o Link do react-router, que exige contexto de Router.
const renderSidebar = (ui: ReactElement): RenderResult => render(ui, { wrapper: MemoryRouter });

const renderStudent = (props: Partial<Omit<SidebarProps, 'role' | 'items' | 'user'>> = {}) =>
  renderSidebar(
    <Sidebar role="student" items={SIDEBAR_MENU_PRESETS.student} user={student} {...props} />,
  );

describe('Sidebar', () => {
  // ── Estrutura base ───────────────────────────────────────────────
  it('should render logo, menu list and user footer', () => {
    renderStudent();

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — aluno/i });
    expect(sidebar).toBeInTheDocument();

    expect(screen.getByRole('img', { name: /escapa!/i })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /navegação do perfil aluno/i }),
    ).toBeInTheDocument();
    // O perfil também aparece no cabeçalho — aqui interessa o rodapé do usuário.
    const footer = within(sidebar.querySelector('footer') as HTMLElement);
    expect(footer.getByText('Jorge Amado')).toBeInTheDocument();
    expect(footer.getByText('Aluno')).toBeInTheDocument();
  });

  it('should render the user initials in the avatar when no avatarUrl is provided', async () => {
    renderStudent();

    expect(await screen.findByText('JA')).toBeInTheDocument();
  });

  // ── Presets por perfil ───────────────────────────────────────────
  const presetCases: Array<{ role: SidebarRole; roleLabel: string; expectedLabels: string[] }> = [
    {
      role: 'student',
      roleLabel: 'Aluno',
      expectedLabels: ['Cursos', 'Meus Cursos', 'Meu Perfil'],
    },
    {
      role: 'company',
      roleLabel: 'Empresa',
      expectedLabels: ['Cursos', 'Métricas', 'Colaboradores', 'Perfil da Empresa'],
    },
    {
      role: 'admin',
      roleLabel: 'Admin',
      expectedLabels: ['Gestão de Cursos', 'Empresas', 'Usuários', 'Métricas'],
    },
  ];

  presetCases.forEach(({ role, roleLabel, expectedLabels }) => {
    it(`should render the default menu preset for role "${role}"`, () => {
      renderSidebar(
        <Sidebar
          role={role}
          items={SIDEBAR_MENU_PRESETS[role]}
          user={{ name: 'Ana Souza', role: 'Perfil de teste' }}
        />,
      );

      const nav = screen.getByRole('navigation', { name: new RegExp(roleLabel, 'i') });

      expectedLabels.forEach((label) => {
        expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
      });

      expect(within(nav).getAllByRole('link')).toHaveLength(expectedLabels.length);

      // Rótulo do perfil no topo, abaixo do logo.
      const sidebar = screen.getByRole('complementary');
      expect(
        within(sidebar.querySelector('header') as HTMLElement).getByText(roleLabel),
      ).toBeInTheDocument();
    });
  });

  it('should render the provided items', () => {
    renderSidebar(<Sidebar role="student" items={customItems} user={student} />);

    const nav = screen.getByRole('navigation');

    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
    expect(within(nav).queryByRole('link', { name: 'Meus Cursos' })).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-catalogo')).toBeInTheDocument();
  });

  // ── Item ativo vs. padrão ────────────────────────────────────────
  it('should use the active Button variant and aria-current on the current route', () => {
    renderSidebar(<Sidebar role="student" items={customItems} user={student} />);

    const activeItem = screen.getByRole('link', { name: 'Trilhas' });
    expect(activeItem.className).toMatch(/variant-active/);
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });

  it('should use the ghost Button variant for non-active items', () => {
    renderSidebar(<Sidebar role="student" items={customItems} user={student} />);

    const inactiveItem = screen.getByRole('link', { name: 'Catálogo' });
    expect(inactiveItem.className).toMatch(/variant-ghost/);
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  // ── Navegação ────────────────────────────────────────────────────
  it('should navigate client-side without a full page reload', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar role="student" items={customItems} user={student} />
        <Routes>
          <Route path="/" element={<p>Início</p>} />
          <Route path="/catalogo" element={<p>Página do catálogo</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Catálogo' }));

    expect(await screen.findByText('Página do catálogo')).toBeInTheDocument();
    expect(screen.queryByText('Início')).not.toBeInTheDocument();
  });

  it('should accept a custom link component', () => {
    render(
      <Sidebar
        role="student"
        items={customItems}
        user={student}
        linkComponent={({ to, ...props }) => <a href={to} data-testid="custom-link" {...props} />}
      />,
    );

    const link = screen.getByRole('link', { name: 'Catálogo' });
    expect(link).toHaveAttribute('data-testid', 'custom-link');
    expect(link).toHaveAttribute('href', '/catalogo');
  });

  // ── Estado collapsed ─────────────────────────────────────────────
  it('should be collapsed by default while the pointer is away', () => {
    renderStudent();

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar.className).toMatch(/collapsed/);
  });

  it('should expand while hovered and collapse again when the pointer leaves', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');

    await userEvent.hover(sidebar);
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    await userEvent.unhover(sidebar);
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('should expand while a menu item has focus', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');

    await userEvent.tab();
    expect(within(sidebar).getByRole('link', { name: 'Cursos' })).toHaveFocus();
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  });

  it('should pin the sidebar open on double click outside the action buttons', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');

    await userEvent.dblClick(sidebar.querySelector('header') as HTMLElement);
    expect(sidebar).toHaveAttribute('data-pinned', 'true');

    await userEvent.unhover(sidebar);
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  });

  it('should restore the hover behavior on a second double click', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');
    const header = sidebar.querySelector('header') as HTMLElement;

    await userEvent.dblClick(header);
    await userEvent.dblClick(header);
    expect(sidebar).toHaveAttribute('data-pinned', 'false');

    await userEvent.unhover(sidebar);
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('should not pin the sidebar when double clicking an action button', async () => {
    renderStudent({ onLogout: vi.fn() });
    const sidebar = screen.getByRole('complementary');

    await userEvent.dblClick(screen.getByRole('button', { name: /sair da conta/i }));
    expect(sidebar).toHaveAttribute('data-pinned', 'false');

    await userEvent.dblClick(within(sidebar).getByRole('link', { name: 'Meus Cursos' }));
    expect(sidebar).toHaveAttribute('data-pinned', 'false');
  });

  it('should hint the double click only while the pointer is over the sidebar', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');

    expect(screen.queryByText(/clique duas vezes/i)).not.toBeInTheDocument();

    await userEvent.hover(sidebar);
    expect(screen.getByText(/clique duas vezes para travar a barra aberta/i)).toBeInTheDocument();

    await userEvent.unhover(sidebar);
    expect(screen.queryByText(/clique duas vezes/i)).not.toBeInTheDocument();
  });

  it('should keep the hint hidden while pinned and the pointer is away', async () => {
    renderStudent();
    const sidebar = screen.getByRole('complementary');

    await userEvent.hover(sidebar);
    await userEvent.dblClick(sidebar.querySelector('header') as HTMLElement);
    expect(screen.getByText(/clique duas vezes para soltar a barra/i)).toBeInTheDocument();

    await userEvent.unhover(sidebar);
    expect(screen.queryByText(/clique duas vezes/i)).not.toBeInTheDocument();
  });

  it('should not render the hint when the collapsed state is controlled', async () => {
    renderStudent({ collapsed: false });

    await userEvent.hover(screen.getByRole('complementary'));
    expect(screen.queryByText(/clique duas vezes/i)).not.toBeInTheDocument();
  });

  it('should ignore the double click when the collapsed state is controlled', async () => {
    renderStudent({ collapsed: true });
    const sidebar = screen.getByRole('complementary');

    await userEvent.dblClick(sidebar.querySelector('header') as HTMLElement);
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar).toHaveAttribute('data-pinned', 'false');
  });

  it('should apply the collapsed state while keeping the accessible names', () => {
    renderStudent({ collapsed: true });

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar.className).toMatch(/collapsed/);

    // Os labels seguem acessíveis via aria-label do Button.
    expect(screen.getByRole('link', { name: 'Meus Cursos' })).toBeInTheDocument();
  });

  // ── Logout ───────────────────────────────────────────────────────
  it('should not render the logout button when onLogout is omitted', () => {
    renderStudent();

    expect(screen.queryByRole('button', { name: /sair da conta/i })).not.toBeInTheDocument();
  });

  it('should call onLogout when the logout button is clicked', async () => {
    const handleLogout = vi.fn();
    renderStudent({ onLogout: handleLogout });

    await userEvent.click(screen.getByRole('button', { name: /sair da conta/i }));
    expect(handleLogout).toHaveBeenCalledOnce();
  });

  // ── Presets exportados ───────────────────────────────────────────
  it('should expose a menu preset for every role', () => {
    expect(SIDEBAR_MENU_PRESETS.student.length).toBeGreaterThan(0);
    expect(SIDEBAR_MENU_PRESETS.company.length).toBeGreaterThan(0);
    expect(SIDEBAR_MENU_PRESETS.admin.length).toBeGreaterThan(0);
  });
});
