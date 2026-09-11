// Barrel export para componentes de layout.
// Adicione novos componentes conforme forem criados:
// export { Header } from './Header/Header';
export { Footer } from './Footer/Footer';
export type { FooterProps, FooterVariant } from './Footer/Footer';
export { Sidebar, SIDEBAR_MENU_PRESETS, SIDEBAR_ROLE_LABELS } from './Sidebar';
export type {
  SidebarProps,
  SidebarRole,
  SidebarMenuItem,
  SidebarUser,
  SidebarLinkProps,
  SidebarLinkComponent,
} from './Sidebar';
export { Navbar } from './Navbar/Navbar';
export type { NavbarProps, NavbarState, NavbarUser } from './Navbar/Navbar';
