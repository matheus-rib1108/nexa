import type { LucideIcon } from "lucide-react";
import {
  Home,
  Target,
  ListTodo,
  CalendarDays,
  AlertTriangle,
  Brain,
  Headphones,
  Sprout,
  GraduationCap,
  StickyNote,
  Lock,
  Trophy,
  Sparkles,
  AlarmClock,
  Settings,
  LifeBuoy,
  Timer,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { title?: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Início", icon: Home },
      { href: "/agora", label: "Agora", icon: Target },
      { href: "/tarefas", label: "Tarefas", icon: ListTodo },
      { href: "/calendario", label: "Calendário", icon: CalendarDays },
      { href: "/prazos", label: "Deadline Radar", icon: AlertTriangle },
    ],
  },
  {
    title: "Organização",
    items: [
      { href: "/brain-dump", label: "Brain Dump", icon: Brain },
      { href: "/foco", label: "Foco", icon: Headphones },
      { href: "/resgate", label: "Não consigo começar", icon: LifeBuoy },
      { href: "/tempo-livre", label: "Tenho um tempinho", icon: Timer },
      { href: "/habitos", label: "Hábitos", icon: Sprout },
    ],
  },
  {
    title: "Estudos & Memória",
    items: [
      { href: "/estudos", label: "Estudos", icon: GraduationCap },
      { href: "/anotacoes", label: "Anotações", icon: StickyNote },
      { href: "/cofre", label: "Cofre", icon: Lock },
    ],
  },
  {
    title: "Você",
    items: [
      { href: "/progresso", label: "Progresso", icon: Trophy },
      { href: "/assistente", label: "Assistente IA", icon: Sparkles },
      { href: "/alarmes", label: "Alarmes", icon: AlarmClock },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/agora", label: "Agora", icon: Target },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/foco", label: "Foco", icon: Headphones },
];
