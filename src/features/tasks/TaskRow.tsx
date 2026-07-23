"use client";

import { motion } from "framer-motion";
import { CalendarClock, GripVertical, Repeat2 } from "lucide-react";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { friendlyDay, friendlyTime } from "@/lib/date";
import { usePlannerSelector } from "@/lib/store/provider";
import type { Task } from "@/types";
import { PriorityDot } from "./PriorityDot";

export function TaskRow({
  task,
  onToggle,
  onOpen,
  dragHandle,
  showDate = false,
  dense = false,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
  dragHandle?: React.ReactNode;
  showDate?: boolean;
  dense?: boolean;
}) {
  const categories = usePlannerSelector((state) => state.categories);
  const category = useMemo(
    () => categories.find((item) => item.id === task.categoryId),
    [categories, task.categoryId],
  );

  const time = friendlyTime(task.time);
  const doneSubtasks = task.subtasks.filter((sub) => sub.done).length;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex items-start gap-3.5 rounded-[var(--radius-md)] pr-2 transition-colors",
        dense ? "py-2" : "py-2.5",
        "hover:bg-[color-mix(in_oklab,var(--paper-deep),transparent_35%)]",
      )}
    >
      {dragHandle ? (
        <span className="absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
          {dragHandle}
        </span>
      ) : null}

      <div className="pt-0.5">
        <Checkbox checked={task.done} onChange={onToggle} label={`Mark "${task.title}" done`} size={dense ? 19 : 21} />
      </div>

      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
        aria-label={`Open ${task.title}`}
      >
        <span className="flex w-full items-center gap-2">
          <motion.span
            animate={{ opacity: task.done ? 0.42 : 1 }}
            className={cn(
              "relative truncate text-[15px] text-ink",
              dense && "text-[14px]",
              task.done && "line-through decoration-blush-400/70 decoration-[1.5px]",
            )}
          >
            {task.title}
          </motion.span>
          {task.repeat !== "none" ? (
            <Repeat2 size={13} strokeWidth={1.6} className="shrink-0 text-ink-faint" aria-label="Repeats" />
          ) : null}
        </span>

        {(category || time || showDate || task.subtasks.length > 0 || task.due) && !dense ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-faint">
            {category ? (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `var(--color-${category.tone})` }}
                />
                {category.name}
              </span>
            ) : null}
            {time ? <span className="tabular">{time}</span> : null}
            {showDate && task.date ? <span>{friendlyDay(task.date)}</span> : null}
            {task.subtasks.length > 0 ? (
              <span className="tabular">
                {doneSubtasks}/{task.subtasks.length} steps
              </span>
            ) : null}
            {task.due ? (
              <span className="flex items-center gap-1 text-rose-ink">
                <CalendarClock size={11} strokeWidth={1.8} />
                {friendlyDay(task.due)}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      <div className="flex items-center gap-2 pt-2">
        {dense && time ? <span className="tabular text-[11.5px] text-ink-faint">{time}</span> : null}
        <PriorityDot priority={task.priority} />
      </div>
    </motion.div>
  );
}

export const DragHandle = () => <GripVertical size={14} strokeWidth={1.6} />;
