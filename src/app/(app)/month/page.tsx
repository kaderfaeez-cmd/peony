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
import { isSameMonth, isToday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { addMonths, format, fromKey, monthGrid, monthKey, toKey, todayKey } from "@/lib/date";
import { useActions, useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import { monthCompletion, tasksOn } from "@/lib/store/selectors";
import { DateNav } from "@/features/planner/DateNav";
import { InlineAdd } from "@/features/tasks/InlineAdd";
import { TaskList } from "@/features/tasks/TaskList";
import { ReflectionPanel } from "@/features/reflect/ReflectionPanel";
import type { Task } from "@/types";

const WEEKDAYS_MONDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_SUNDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHIP_LIMIT = 3;

function TaskChip({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn(
        "group/chip flex cursor-grab items-center gap-1.5 rounded-[5px] px-1 py-[3px] text-left text-[11px] leading-tight transition-colors",
        "hover:bg-blush-50 dark:hover:bg-blush-600/15",
        isDragging && "opacity-40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1 w-1 shrink-0 rounded-full",
          task.done ? "bg-[var(--hairline-strong)]" : task.priority === "high" ? "bg-blush-600" : "bg-blush-200",
        )}
      />
      <span className={cn("truncate", task.done ? "text-ink-faint line-through" : "text-ink-soft")}>
        {task.title}
      </span>
    </div>
  );
}

function DayCell({
  date,
  anchor,
  tasks,
  selected,
  onSelect,
}: {
  date: Date;
  anchor: Date;
  tasks: Task[];
  selected: boolean;
  onSelect: () => void;
}) {
  const key = toKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${key}` });
  const outside = !isSameMonth(date, anchor);
  const today = isToday(date);
  const deadlines = tasks.filter((task) => task.due === key && !task.done).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-[62px] flex-col gap-1 border-b border-r border-[var(--hairline)] p-1.5 transition-colors sm:min-h-[112px] sm:p-2",
        outside && "bg-[color-mix(in_oklab,var(--paper-deep),transparent_55%)]",
        isOver && "bg-blush-50 dark:bg-blush-600/15",
        selected && "ring-1 ring-inset ring-blush-400",
      )}
    >
      <button
        onClick={onSelect}
        className="flex items-center justify-between text-left"
        aria-label={`Open ${format(date, "d MMMM")}`}
      >
        <span
          className={cn(
            "tabular grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12px] transition-colors",
            today && "bg-blush-600 font-medium text-[#33161f]",
            !today && outside && "text-ink-faint/50",
            !today && !outside && "text-ink-soft hover:bg-blush-50 dark:hover:bg-blush-600/15",
          )}
        >
          {format(date, "d")}
        </span>
        {deadlines > 0 ? (
          <span
            title={`${deadlines} deadline${deadlines > 1 ? "s" : ""}`}
            className="h-1.5 w-1.5 rounded-full border border-blush-600"
          />
        ) : null}
      </button>

      {/* Phones get dots — three truncated chips in a 50px column helps nobody. */}
      <div className="flex flex-wrap gap-1 px-0.5 sm:hidden">
        {tasks.slice(0, 4).map((task) => (
          <span
            key={task.id}
            className={cn(
              "h-1 w-1 rounded-full",
              task.done ? "bg-[var(--hairline-strong)]" : "bg-blush-400",
            )}
          />
        ))}
      </div>

      <div className="hidden space-y-[2px] sm:block">
        {tasks.slice(0, CHIP_LIMIT).map((task) => (
          <TaskChip key={task.id} task={task} />
        ))}
        {tasks.length > CHIP_LIMIT ? (
          <button onClick={onSelect} className="px-1 text-[10.5px] text-ink-faint hover:text-rose-ink">
            +{tasks.length - CHIP_LIMIT} more
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function MonthPage() {
  const tasks = usePlannerSelector((state) => state.tasks);
  const settings = useSettings();
  const actions = useActions();
  const hydrated = useHydrated();
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState<string>(todayKey());

  const grid = useMemo(() => monthGrid(anchor, settings.weekStartsMonday), [anchor, settings.weekStartsMonday]);
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.date || task.archived) continue;
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
    }
    return map;
  }, [tasks]);

  const stats = useMemo(() => monthCompletion(tasks, anchor), [tasks, anchor]);
  const selectedTasks = useMemo(() => tasksOn(tasks, selected), [tasks, selected]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("cell:")) return;
    const target = overId.slice(5);
    const task = tasks.find((item) => item.id === active.id);
    if (!task || task.date === target) return;
    actions.updateTask(task.id, { date: target });
  };

  return (
    <div>
      <PageHeader
        eyebrow={format(anchor, "yyyy")}
        title={format(anchor, "MMMM")}
        lede={
          stats.total === 0
            ? "A month with nothing in it yet."
            : `${stats.done} of ${stats.total} done this month.`
        }
        aside={
          <div className="flex items-center gap-6">
            <DateNav
              unit="month"
              onPrevious={() => setAnchor(addMonths(anchor, -1))}
              onNext={() => setAnchor(addMonths(anchor, 1))}
              onReset={() => setAnchor(new Date())}
              resetLabel="This month"
            />
            <ProgressRing value={stats.ratio} size={92} label="Month" />
          </div>
        }
      />

      {!hydrated ? (
        <Skeleton className="h-[560px] w-full rounded-[var(--radius-lg)]" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border-l border-t border-[var(--hairline)]">
            <div className="grid grid-cols-7">
              {(settings.weekStartsMonday ? WEEKDAYS_MONDAY : WEEKDAYS_SUNDAY).map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-[var(--hairline)] px-2 py-2.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
              {grid.map((date) => {
                const key = toKey(date);
                return (
                  <DayCell
                    key={key}
                    date={date}
                    anchor={anchor}
                    tasks={byDay.get(key) ?? []}
                    selected={selected === key}
                    onSelect={() => setSelected(key)}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <Section title={format(fromKey(selected), "EEEE d MMMM")}>
            <TaskList
              tasks={selectedTasks}
              dense
              empty={<p className="py-2 text-[13.5px] text-ink-soft">Nothing on this day yet.</p>}
            />
            <InlineAdd
              draft={{ date: selected, dayPart: "morning" }}
              placeholder="Add to this day"
              className="mt-2 border-t border-[var(--hairline)] pt-3"
            />
          </Section>
        </motion.div>
      </AnimatePresence>

      <Section title="Monthly reflection" className="mt-16">
        <ReflectionPanel period={monthKey(anchor)} scope="month" />
      </Section>
    </div>
  );
}
