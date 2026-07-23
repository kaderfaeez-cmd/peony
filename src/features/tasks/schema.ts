import { z } from "zod";

const optionalText = z
  .string()
  .transform((value) => value.trim())
  .optional();

/** Empty native date/time inputs come back as "" — normalise to null once, here. */
const nullableKey = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Give it a name"),
  description: optionalText,
  notes: optionalText,
  categoryId: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  dayPart: z.enum(["morning", "afternoon", "evening"]),
  date: nullableKey,
  time: nullableKey,
  due: nullableKey,
  repeat: z.enum(["none", "daily", "weekdays", "weekly", "monthly", "yearly"]),
});

export type TaskFormValues = z.input<typeof taskSchema>;
export type TaskFormOutput = z.output<typeof taskSchema>;

export const REPEAT_LABELS: Record<TaskFormOutput["repeat"], string> = {
  none: "Once",
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Every week",
  monthly: "Every month",
  yearly: "Every year",
};

export const PRIORITY_LABELS: Record<TaskFormOutput["priority"], string> = {
  low: "Gentle",
  medium: "Normal",
  high: "Matters most",
};

export const DAY_PARTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
] as const;
