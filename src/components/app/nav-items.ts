import {
  CreditCard,
  Images,
  Kanban,
  MagnifyingGlass,
  SquaresFour,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";

export interface AppNavItem {
  href: string;
  label: string;
  icon: Icon;
  /** false = route not built yet; shown disabled instead of linking to a 404. */
  ready: boolean;
  /** Match only the exact path (used for the dashboard root). */
  exact?: boolean;
}

export const APP_NAV: AppNavItem[] = [
  { href: "/app", label: "Painel", icon: SquaresFour, ready: true, exact: true },
  { href: "/app/buscar", label: "Buscar empresas", icon: MagnifyingGlass, ready: false },
  { href: "/app/leads", label: "Leads", icon: Kanban, ready: false },
  { href: "/app/portfolio", label: "Portfólio", icon: Images, ready: false },
  { href: "/app/assinatura", label: "Assinatura", icon: CreditCard, ready: false },
  { href: "/app/perfil", label: "Perfil", icon: UserCircle, ready: true },
];
