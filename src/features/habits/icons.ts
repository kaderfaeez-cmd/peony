import {
  BookOpen,
  Droplet,
  Dumbbell,
  Flower,
  HeartPulse,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** A short, curated set — an icon picker with 900 options is a chore, not a joy. */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  book: BookOpen,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  heart: HeartPulse,
  moon: Moon,
  sun: Sun,
  wind: Wind,
  flower: Flower,
  pen: NotebookPen,
};

export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS);

export const habitIcon = (key: string): LucideIcon => HABIT_ICONS[key] ?? Sparkles;
