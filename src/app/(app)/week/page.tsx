"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { isToday } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TaskSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { addDays, format, toKey, weekDays, weekKey } from "@/lib/date";
import { useActions, useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import { completion, tasksOn } from "@/lib/store/selectors";
import { DateNav } from "@/features/planner/DateNav";
import { InlineAdd } from "@/features/tasks/InlineAdd";
import { TaskDetailSheet } from "@/features/tasks/TaskDetailSheet";
import { DragHandle, TaskRow } from "@/features/tasks/TaskRow";
import { ReflectionPanel } from "@/features/reflect/ReflectionPanel";
import type { Task } from "@/types";

const COLLAPSED_ROWS = 3;

function DayBand({
  date,
  tasks,
  expanded,
  onToggleExpanded,
  onOpenTask,
}: {
  date: Date;
  tasks: Task[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenTask: (id: string) => void;
}) {
  const actions = useActions();
  const key = toKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: `day:${key}` });
  const stats = completion(tasks);
  const today = isToday(date);
  const visible = expanded ? tasks : tasks.slice(0, COLLAPSED_ROWS);
  const hidden = tasks.length - visible.length;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "grid gap-x-8 gap-y-2 border-t border-[var(--hairline)] py-6 transition-colors sm:grid-cols-[168px_minmax(0,1fr)]",
        isOver && "bg-blush-50/60 dark:bg-blush-600/10",
      )}
    >
      <header className="flex items-start gap-4 sm:block">
        <div className="flex items-baseline gap-2.5">
          <span
            className={cn(
              "numeral text-[26px] leading-none",
              today ? "text-rose-ink" : "text-ink",
            )}
          >
            {format(date, "d")}
          </span>
          <span className={cn("text-[13px]", today ? "text-rose-ink" : "text-ink-soft")}>
            {format(date, "EEEE")}
          </span>
        </div>
        {tasks.length > 0 ? (
          <div className="mt-2 flex items-center gap-2 sm:mt-3">
            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-[var(--hairline)]">
              <motion.div
                className="h-full rounded-full bg-blush-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.ratio * 100}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>
            <span className="tabular text-[11px] text-ink-faint">
              {stats.done}/{stats.total}
            </span>
          </div>
        ) : null}
      </header>

      <div>
        <AnimatePresence initial={false}>
          {visible.map((task) => (
            <MovableTask
              key={task.id}
              task={task}
              onToggle={() => actions.toggleTask(task.id)}
              onOpen={() => onOpenTask(task.id)}
            />
          ))}
        </AnimatePresence>

        {hidden > 0 ? (
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-1.5 py-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-rose-ink"
          >
            <ChevronDown size={13} strokeWidth={1.8} />
            {hidden} more
          </button>
        ) : null}

        {expanded || tasks.length === 0 ? (
          <InlineAdd draft={{ date: key, dayPart: "morning" }} placeholder="Add" className="py-1" />
        ) : (
          <button
            onClick={onToggleExpanded}
            className="py-1.5 text-[12.5px] text-ink-faint transition-colors hover:text-rose-ink"
          >
            Add something
          </button>
        )}
      </div>
    </section>
  );
}

/** Dragging here moves a task to another day rather than reordering within one. */
function MovableTask({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("relative", isDragging && "z-10 opacity-45")}
    >
      <TaskRow
        task={task}
        dense
        onToggle={onToggle}
        onOpen={onOpen}
        dragHandle={
          <span {...attributes} {...listeners} aria-label={`Move ${task.title} to another day`}>
            <DragHandle />
          </span>
        }
      />
    </div>
  );
}

export default function WeekPage() {
  const tasks = usePlannerSelector((state) => state.tasks);
  const settings = useSettings();
  const actions = useActions();
  const hydrated = useHydrated();
  const [anchor, setAnchor] = useState(new Date());
  const [expanded, setExpanded] = useState<string | null>(toKey(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);

  const days = useMemo(
    () => weekDays(anchor, settings.weekStartsMonday),
    [anchor, settings.weekStartsMonday],
  );
  const perDay = useMemo(
    () => days.map((day) => ({ day, tasks: tasksOn(tasks, toKey(day)) })),
    [days, tasks],
  );
  const stats = useMemo(
    () => completion(perDay.flatMap((entry) => entry.tasks)),
    [perDay],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("day:")) return;
    const target = overId.slice(4);
    const task = tasks.find((item) => item.id === active.id);
    if (!task || task.date === target) return;
    actions.updateTask(task.id, { date: target });
  };

  const label = `${format(days[0], "d MMM")} – ${format(days[6], "d MMM")}`;

  return (
    <div>
      <PageHeader
        eyebrow="This week"
        title={label}
        lede={
          stats.total === 0
            ? "Seven open days. Put something small in one of them."
            : `${stats.done} of ${stats.total} done across the week.`
        }
        aside={
          <div className="flex items-center gap-6">
            <DateNav
              unit="week"
              onPrevious={() => setAnchor(addDays(anchor, -7))}
              onNext={() => setAnchor(addDays(anchor, 7))}
              onReset={() => setAnchor(new Date())}
              resetLabel="This week"
            />
            <ProgressRing value={stats.ratio} size={92} label="Week" />
          </div>
        }
      />

      {!hydrated ? (
        <TaskSkeleton rows={7} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div>
            {perDay.map(({ day, tasks: dayTasks }) => {
              const key = toKey(day);
              return (
                <DayBand
                  key={key}
                  date={day}
                  tasks={dayTasks}
                  expanded={expanded === key}
                  onToggleExpanded={() => setExpanded(expanded === key ? null : key)}
                  onOpenTask={setOpenId}
                />
              );
            })}
          </div>
          <TaskDetailSheet taskId={openId} onClose={() => setOpenId(null)} />
        </DndContext>
      )}

      <Section title="Weekly reflection" className="mt-16">
        <ReflectionPanel period={weekKey(anchor)} scope="week" />
      </Section>
    </div>
  );
}
