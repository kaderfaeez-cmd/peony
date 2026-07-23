"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { useActions, usePlannerSelector } from "@/lib/store/provider";
import { tasksInPart } from "@/lib/store/selectors";
import type { DayKey, DayPart, Task } from "@/types";
import { InlineAdd } from "@/features/tasks/InlineAdd";
import { TaskDetailSheet } from "@/features/tasks/TaskDetailSheet";
import { DragHandle, TaskRow } from "@/features/tasks/TaskRow";

const PARTS: Array<{ id: DayPart; label: string; hint: string }> = [
  { id: "morning", label: "Morning", hint: "before noon" },
  { id: "afternoon", label: "Afternoon", hint: "noon – five" },
  { id: "evening", label: "Evening", hint: "after five" },
];

function SortableRow({
  task,
  onOpen,
  onToggle,
}: {
  task: Task;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "opacity-35")}
    >
      <TaskRow
        task={task}
        onOpen={onOpen}
        onToggle={onToggle}
        dragHandle={
          <span {...attributes} {...listeners} aria-label={`Reorder ${task.title}`}>
            <DragHandle />
          </span>
        }
      />
    </div>
  );
}

function PartColumn({
  part,
  label,
  hint,
  tasks,
  date,
  onOpen,
}: {
  part: DayPart;
  label: string;
  hint: string;
  tasks: Task[];
  date: DayKey;
  onOpen: (id: string) => void;
}) {
  const actions = useActions();
  const { setNodeRef, isOver } = useDroppable({ id: `part:${part}` });
  const done = tasks.filter((task) => task.done).length;

  return (
    <section className="grid gap-x-8 gap-y-3 border-t border-[var(--hairline)] py-7 sm:grid-cols-[132px_minmax(0,1fr)]">
      <header className="sm:sticky sm:top-24 sm:self-start">
        <h2 className="font-display text-[19px] leading-none text-ink">{label}</h2>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-faint">{hint}</p>
        {tasks.length > 0 ? (
          <p className="tabular mt-3 text-[12px] text-ink-soft">
            {done}/{tasks.length} done
          </p>
        ) : null}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[64px] rounded-[var(--radius-md)] pl-1 transition-colors duration-200",
          isOver && "bg-blush-50/70 dark:bg-blush-600/10",
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <SortableRow
                key={task.id}
                task={task}
                onOpen={() => onOpen(task.id)}
                onToggle={() => actions.toggleTask(task.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        <InlineAdd draft={{ date, dayPart: part }} placeholder={`Add to ${label.toLowerCase()}`} />
      </div>
    </section>
  );
}

/** The day, in three unhurried acts. */
export function DayPlanner({ date }: { date: DayKey }) {
  const tasks = usePlannerSelector((state) => state.tasks);
  const actions = useActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      PARTS.map((part) => ({
        ...part,
        tasks: tasksInPart(tasks, date, part.id),
      })),
    [tasks, date],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = draggingId ? tasks.find((task) => task.id === draggingId) ?? null : null;
  const total = grouped.reduce((sum, group) => sum + group.tasks.length, 0);

  const handleDragStart = (event: DragStartEvent) => setDraggingId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const dragged = tasks.find((task) => task.id === active.id);
    if (!dragged) return;

    const overId = String(over.id);
    const targetPart: DayPart = overId.startsWith("part:")
      ? (overId.slice(5) as DayPart)
      : (tasks.find((task) => task.id === overId)?.dayPart ?? dragged.dayPart);

    const destination = tasksInPart(tasks, date, targetPart).filter((task) => task.id !== dragged.id);
    const overIndex = destination.findIndex((task) => task.id === overId);
    const insertAt = overIndex === -1 ? destination.length : overIndex;

    const next = [...destination.slice(0, insertAt), dragged, ...destination.slice(insertAt)];

    if (dragged.dayPart !== targetPart) actions.updateTask(dragged.id, { dayPart: targetPart });
    actions.reorderTasks(next.map((task) => task.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div>
        {grouped.map((group) => (
          <PartColumn
            key={group.id}
            part={group.id}
            label={group.label}
            hint={group.hint}
            tasks={group.tasks}
            date={date}
            onOpen={setOpenId}
          />
        ))}

        {total === 0 ? (
          <EmptyState
            variant="stem"
            title="Nothing planned yet"
            body="Add one thing to the morning. The day tends to follow."
          />
        ) : null}
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeTask ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface)] px-3 shadow-[var(--shadow-lift)]">
            <TaskRow task={activeTask} onOpen={() => {}} onToggle={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      <TaskDetailSheet taskId={openId} onClose={() => setOpenId(null)} />
    </DndContext>
  );
}
