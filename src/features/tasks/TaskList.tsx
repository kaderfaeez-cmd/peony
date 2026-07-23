"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useActions } from "@/lib/store/provider";
import type { Task } from "@/types";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { TaskRow } from "./TaskRow";

/** Rows plus the detail sheet they open — the pairing every screen needs. */
export function TaskList({
  tasks,
  showDate = false,
  dense = false,
  empty,
}: {
  tasks: Task[];
  showDate?: boolean;
  dense?: boolean;
  empty?: React.ReactNode;
}) {
  const actions = useActions();
  const [openId, setOpenId] = useState<string | null>(null);

  if (tasks.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      <div className="-mx-2">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              dense={dense}
              showDate={showDate}
              onToggle={() => actions.toggleTask(task.id)}
              onOpen={() => setOpenId(task.id)}
            />
          ))}
        </AnimatePresence>
      </div>
      <TaskDetailSheet taskId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
