import {
  CalendarDays,
  CalendarRange,
  Feather,
  Flower2,
  ListTodo,
  NotebookPen,
  Repeat2,
  Sun,
  Target,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Single-key shortcut, pressed on its own from anywhere. */
  key?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Plan",
    items: [
      { href: "/home", label: "Home", icon: Flower2, key: "h" },
      { href: "/today", label: "Today", icon: Sun, key: "t" },
      { href: "/week", label: "Week", icon: CalendarRange, key: "w" },
      { href: "/month", label: "Month", icon: CalendarDays, key: "m" },
    ],
  },
  {
    title: "Tend",
    items: [
      { href: "/tasks", label: "Tasks", icon: ListTodo, key: "a" },
      { href: "/kitchen", label: "Kitchen", icon: UtensilsCrossed, key: "k" },
      { href: "/habits", label: "Habits", icon: Repeat2, key: "b" },
      { href: "/goals", label: "Goals", icon: Target, key: "g" },
      { href: "/focus", label: "Focus", icon: Timer, key: "f" },
    ],
  },
  {
    title: "Reflect",
    items: [
      { href: "/notes", label: "Notes", icon: NotebookPen, key: "n" },
      { href: "/journal", label: "Journal", icon: Feather, key: "j" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((group) => group.items);

export const titleFor = (pathname: string) =>
  ALL_NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Settings";
