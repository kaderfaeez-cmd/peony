"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input, Label } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toaster";
import { useActions, usePlannerSelector } from "@/lib/store/provider";
import type { Task, TaskDraft } from "@/types";
import { TaskForm } from "./TaskForm";

export function TaskDetailSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const task = usePlannerSelector((state) => state.tasks.find((item) => item.id === taskId) ?? null);
  const actions = useActions();
  const { notify } = useToast();
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const handleSave = (values: TaskDraft) => {
    if (!task) return;
    actions.updateTask(task.id, values as Partial<Task>);
    notify("Saved");
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    const removed = actions.deleteTask(task.id);
    onClose();
    if (removed) notify("Task deleted", { label: "Undo", run: () => actions.restoreTask(removed) });
  };

  return (
    <Sheet
      open={Boolean(task)}
      onClose={onClose}
      title={task?.title ?? "Task"}
      description="Every detail lives here — the row stays quiet."
      footer={
        task ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <IconButton
                label={task.archived ? "Unarchive" : "Archive"}
                onClick={() => {
                  actions.archiveTask(task.id, !task.archived);
                  notify(task.archived ? "Back in your list" : "Archived");
                  onClose();
                }}
              >
                <Archive size={15} strokeWidth={1.6} />
              </IconButton>
              <IconButton label="Delete task" onClick={handleDelete} className="hover:text-rose-ink">
                <Trash2 size={15} strokeWidth={1.6} />
              </IconButton>
            </div>
          </div>
        ) : null
      }
    >
      {task ? (
        <div className="space-y-9 pb-2">
          <section className="space-y-3">
            <Label>Steps</Label>
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {task.subtasks.map((subtask) => (
                  <motion.div
                    key={subtask.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="group flex items-center gap-3 py-1"
                  >
                    <Checkbox
                      size={18}
                      checked={subtask.done}
                      onChange={() => actions.toggleSubtask(task.id, subtask.id)}
                      label={subtask.title}
                    />
                    <span
                      className={`flex-1 text-[14px] ${
                        subtask.done ? "text-ink-faint line-through" : "text-ink-soft"
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <IconButton
                      label="Remove step"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => actions.removeSubtask(task.id, subtask.id)}
                    >
                      <Trash2 size={13} strokeWidth={1.6} />
                    </IconButton>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const title = subtaskTitle.trim();
                if (!title) return;
                actions.addSubtask(task.id, title);
                setSubtaskTitle("");
              }}
              className="flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={1.8} className="text-ink-faint" />
              <Input
                value={subtaskTitle}
                onChange={(event) => setSubtaskTitle(event.target.value)}
                placeholder="Break it into a smaller step"
                className="text-[14px]"
                aria-label="New step"
              />
            </form>
          </section>

          <div className="border-t border-[var(--hairline)] pt-8">
            <TaskForm defaults={task} submitLabel="Save changes" onSubmit={handleSave} onCancel={onClose} />
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

/** Global "add anything" sheet, opened from the top bar or the N shortcut. */
export function QuickAddSheet({
  open,
  draft,
  onClose,
}: {
  open: boolean;
  draft: TaskDraft | null;
  onClose: () => void;
}) {
  const actions = useActions();
  const { notify } = useToast();

  return (
    <Sheet open={open} onClose={onClose} title="Add a task" description="Small and specific beats big and vague.">
      <TaskForm
        defaults={draft}
        onSubmit={(values) => {
          const task = actions.createTask(values);
          notify("Added", { label: "Undo", run: () => actions.deleteTask(task.id) });
          onClose();
        }}
        onCancel={onClose}
      />
    </Sheet>
  );
}
