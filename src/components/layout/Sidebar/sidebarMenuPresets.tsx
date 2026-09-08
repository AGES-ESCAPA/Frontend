import {
  Award,
  BarChart3,
  Compass,
  LayoutPanelLeft,
  PlayCircle,
  ShoppingCart,
  Ticket,
  Users,
} from 'lucide-react';
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
      icon: <PlayCircle size={SIDEBAR_ICON_SIZE} />,
      label: 'Meus Cursos',
      route: '/meus-cursos',
    },
    { icon: <Award size={SIDEBAR_ICON_SIZE} />, label: 'Certificados', route: '/certificados' },
    { icon: <Compass size={SIDEBAR_ICON_SIZE} />, label: 'Explorar Catálogo', route: '/catalogo' },
  ],
  company: [
    {
      icon: <Users size={SIDEBAR_ICON_SIZE} />,
      label: 'Colaboradores',
      route: '/empresa/colaboradores',
    },
    {
      icon: <Ticket size={SIDEBAR_ICON_SIZE} />,
      label: 'Assentos Disponíveis',
      route: '/empresa/assentos',
    },
    {
      icon: <BarChart3 size={SIDEBAR_ICON_SIZE} />,
      label: 'Relatórios',
      route: '/empresa/relatorios',
    },
  ],
  admin: [
    {
      icon: <LayoutPanelLeft size={SIDEBAR_ICON_SIZE} />,
      label: 'Gestão de Cursos',
      route: '/admin/cursos',
    },
    {
      icon: <ShoppingCart size={SIDEBAR_ICON_SIZE} />,
      label: 'Gestão de Compras',
      route: '/admin/compras',
    },
    { icon: <Users size={SIDEBAR_ICON_SIZE} />, label: 'Usuários', route: '/admin/usuarios' },
    {
      icon: <BarChart3 size={SIDEBAR_ICON_SIZE} />,
      label: 'Relatórios / BI',
      route: '/admin/relatorios',
    },
  ],
};
