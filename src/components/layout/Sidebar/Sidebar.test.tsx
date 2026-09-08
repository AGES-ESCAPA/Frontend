import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { SidebarMenuItem, SidebarRole, SidebarUser } from './Sidebar';
import { SIDEBAR_MENU_PRESETS } from './sidebarMenuPresets';

const student: SidebarUser = { name: 'Jorge Amado', role: 'Estudante' };

const customItems: SidebarMenuItem[] = [
  { icon: <BookOpen data-testid="icon-catalogo" />, label: 'Catálogo', route: '/catalogo' },
  { icon: <BookOpen />, label: 'Trilhas', route: '/trilhas', active: true },
];

describe('Sidebar', () => {
  // ── Estrutura base ───────────────────────────────────────────────
  it('should render logo, menu list and user footer', () => {
    render(<Sidebar role="student" user={student} />);

    const sidebar = screen.getByRole('complementary', { name: /menu lateral — aluno/i });
    expect(sidebar).toBeInTheDocument();

    expect(screen.getByRole('img', { name: /escapa!/i })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /navegação do perfil aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Jorge Amado')).toBeInTheDocument();
    expect(screen.getByText('Estudante')).toBeInTheDocument();
  });

  it('should render the user initials in the avatar when no avatarUrl is provided', async () => {
    render(<Sidebar role="student" user={student} />);

    expect(await screen.findByText('JA')).toBeInTheDocument();
  });

  // ── Presets por perfil ───────────────────────────────────────────
  const presetCases: Array<{ role: SidebarRole; roleLabel: string; expectedLabels: string[] }> = [
    {
      role: 'student',
      roleLabel: 'Aluno',
      expectedLabels: ['Meus Cursos', 'Certificados', 'Explorar Catálogo'],
    },
    {
      role: 'company',
      roleLabel: 'Empresa',
      expectedLabels: ['Colaboradores', 'Assentos Disponíveis', 'Relatórios'],
    },
    {
      role: 'admin',
      roleLabel: 'Admin',
      expectedLabels: ['Gestão de Cursos', 'Gestão de Compras', 'Usuários', 'Relatórios / BI'],
    },
  ];

  presetCases.forEach(({ role, roleLabel, expectedLabels }) => {
    it(`should render the default menu preset for role "${role}"`, () => {
      render(<Sidebar role={role} user={{ name: 'Ana Souza', role: 'Perfil de teste' }} />);

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

  it('should override the preset when items are provided', () => {
    render(<Sidebar role="student" items={customItems} user={student} />);

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
    render(<Sidebar role="student" items={customItems} user={student} />);

    const activeItem = screen.getByRole('link', { name: 'Trilhas' });
    expect(activeItem.className).toMatch(/variant-active/);
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });

  it('should use the ghost Button variant for non-active items', () => {
    render(<Sidebar role="student" items={customItems} user={student} />);

    const inactiveItem = screen.getByRole('link', { name: 'Catálogo' });
    expect(inactiveItem.className).toMatch(/variant-ghost/);
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  // ── Estado collapsed ─────────────────────────────────────────────
  it('should not be collapsed by default', () => {
    render(<Sidebar role="student" user={student} />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
    expect(sidebar.className).not.toMatch(/collapsed/);
  });

  it('should apply the collapsed state while keeping the avatar and accessible names', async () => {
    render(<Sidebar role="student" user={student} collapsed />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    expect(sidebar.className).toMatch(/collapsed/);

    // Avatar permanece; os labels seguem acessíveis via aria-label do Button.
    expect(await screen.findByText('JA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Meus Cursos' })).toBeInTheDocument();
  });

  // ── Logout ───────────────────────────────────────────────────────
  it('should not render the logout button when onLogout is omitted', () => {
    render(<Sidebar role="student" user={student} />);

    expect(screen.queryByRole('button', { name: /sair da conta/i })).not.toBeInTheDocument();
  });

  it('should call onLogout when the logout button is clicked', async () => {
    const handleLogout = vi.fn();
    render(<Sidebar role="student" user={student} onLogout={handleLogout} />);

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
