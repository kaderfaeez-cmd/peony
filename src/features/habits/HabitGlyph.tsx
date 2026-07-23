"use client";

import { createElement } from "react";
import { habitIcon } from "./icons";

/**
 * Resolves a habit's icon name to a Lucide component at module scope, so no
 * screen has to create a component while rendering.
 */
export function HabitGlyph({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return createElement(habitIcon(name), { size, strokeWidth: 1.6, className });
}
