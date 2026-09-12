import { BarChart3, Building2, LayoutDashboard, Play, UserRoundPen, Users } from 'lucide-react';
import type { SidebarMenuItem, SidebarRole } from './Sidebar';

/** Tamanho padrão dos ícones Lucide dentro da Sidebar (grid 24x24, traço 2px). */
export const SIDEBAR_ICON_SIZE = 20;

/** Rótulo do perfil exibido abaixo do logo, no topo da Sidebar. */
export const SIDEBAR_ROLE_LABELS: Record<SidebarRole, string> = {
  student: 'Aluno',
  company: 'Empresa',
  admin: 'Admin',
};

/**
 * Presets de menu por perfil. São apenas os padrões — passar `items`
 * para a Sidebar sobrescreve a lista inteira.
 */
export const SIDEBAR_MENU_PRESETS: Record<SidebarRole, SidebarMenuItem[]> = {
  student: [
    {
      icon: <LayoutDashboard size={SIDEBAR_ICON_SIZE} />,
      label: 'Cursos',
      route: '/courses',
    },
    {
      icon: <Play size={SIDEBAR_ICON_SIZE} />,
      label: 'Meus Cursos',
      route: '/meus-cursos',
    },
    {
      icon: <UserRoundPen size={SIDEBAR_ICON_SIZE} />,
      label: 'Meu Perfil',
      route: '/meu-perfil',
    },
  ],
  company: [
    {
      icon: <LayoutDashboard size={SIDEBAR_ICON_SIZE} />,
      label: 'Cursos',
      route: '/empresa/cursos',
    },
    {
      icon: <BarChart3 size={SIDEBAR_ICON_SIZE} />,
      label: 'Métricas',
      route: '/empresa/dashboard',
    },
    {
      icon: <Users size={SIDEBAR_ICON_SIZE} />,
      label: 'Colaboradores',
      route: '/empresa/colaboradores',
    },
    {
      icon: <UserRoundPen size={SIDEBAR_ICON_SIZE} />,
      label: 'Perfil da Empresa',
      route: '/empresa/perfil',
    },
  ],
  admin: [
    {
      icon: <LayoutDashboard size={SIDEBAR_ICON_SIZE} />,
      label: 'Gestão de Cursos',
      route: '/admin/cursos',
    },
    {
      icon: <Building2 size={SIDEBAR_ICON_SIZE} />,
      label: 'Empresas',
      route: '/admin/empresas',
    },
    { icon: <Users size={SIDEBAR_ICON_SIZE} />, label: 'Usuários', route: '/admin/usuarios' },
    {
      icon: <BarChart3 size={SIDEBAR_ICON_SIZE} />,
      label: 'Métricas',
      route: '/admin/metricas',
    },
  ],
};
