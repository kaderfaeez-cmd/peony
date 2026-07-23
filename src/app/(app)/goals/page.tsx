"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { useCelebrate } from "@/components/ui/Celebration";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressRing";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { friendlyDay } from "@/lib/date";
import { useActions, useHydrated, usePlannerSelector } from "@/lib/store/provider";
import { goalProgress } from "@/lib/store/selectors";
import type { Goal } from "@/types";

function GoalBand({ goal }: { goal: Goal }) {
  const actions = useActions();
  const { notify } = useToast();
  const celebrate = useCelebrate();
  const [milestone, setMilestone] = useState("");
  const progress = goalProgress(goal);
  const complete = progress.total > 0 && progress.done === progress.total;

  // Finishing the last milestone should feel like something happened.
  useEffect(() => {
    if (!complete || goal.celebratedAt) return;
    actions.updateGoal(goal.id, { celebratedAt: new Date().toISOString() });
    celebrate(1.4);
    notify(`“${goal.title}” — done. That was a whole goal.`);
  }, [complete, goal.celebratedAt, goal.id, goal.title, actions, celebrate, notify]);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border-t border-[var(--hairline)] py-8"
    >
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="mb-2 text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                {goal.horizon === "long" ? "Long term" : "Short term"}
                {goal.due ? ` · by ${friendlyDay(goal.due)}` : ""}
              </p>
              <h2 className="font-display text-[clamp(1.4rem,1.1rem+0.8vw,1.9rem)] leading-tight text-ink">
                {goal.title}
              </h2>
              {goal.intention ? (
                <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-ink-soft">
                  {goal.intention}
                </p>
              ) : null}
            </div>
            <IconButton
              label="Delete goal"
              className="opacity-60 hover:opacity-100"
              onClick={() => {
                const removed = actions.deleteGoal(goal.id);
                if (removed)
                  notify("Goal removed", { label: "Undo", run: () => actions.restoreGoal(removed) });
              }}
            >
              <Trash2 size={14} strokeWidth={1.6} />
            </IconButton>
          </div>

          <div className="mt-6 max-w-[420px]">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11.5px] text-ink-faint">
                {progress.done} of {progress.total || 0} milestones
              </span>
              <span className="numeral text-[15px] text-ink">
                {Math.round(progress.ratio * 100)}
                <span className="text-[11px] text-ink-faint">%</span>
              </span>
            </div>
            <ProgressBar value={progress.ratio} />
          </div>
        </div>

        <div>
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {goal.milestones.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 py-1"
                >
                  <Checkbox
                    size={18}
                    checked={item.done}
                    onChange={() => actions.toggleMilestone(goal.id, item.id)}
                    label={item.title}
                  />
                  <span
                    className={`text-[13.5px] ${item.done ? "text-ink-faint line-through" : "text-ink-soft"}`}
                  >
                    {item.title}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!milestone.trim()) return;
              actions.addMilestone(goal.id, milestone.trim());
              setMilestone("");
            }}
            className="mt-2 flex items-center gap-2.5"
          >
            <Plus size={13} strokeWidth={1.8} className="text-ink-faint" />
            <input
              value={milestone}
              onChange={(event) => setMilestone(event.target.value)}
              placeholder="Add a milestone"
              aria-label={`Add a milestone to ${goal.title}`}
              className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-ink-faint/70 focus:outline-none"
            />
          </form>
        </div>
      </div>
    </motion.section>
  );
}

function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const actions = useActions();
  const [form, setForm] = useState({ title: "", intention: "", horizon: "short", due: "" });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    actions.addGoal({
      title: form.title.trim(),
      intention: form.intention.trim(),
      horizon: form.horizon as Goal["horizon"],
      due: form.due || null,
      milestones: [],
      celebratedAt: null,
      archived: false,
    });
    setForm({ title: "", intention: "", horizon: "short", due: "" });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="New goal" description="Name the thing. Break it down later.">
      <form onSubmit={submit} className="space-y-8">
        <div className="space-y-1.5">
          <Label htmlFor="goal-title">The goal</Label>
          <Input
            id="goal-title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Finish the semester calmly"
            className="font-display text-[19px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal-intention">Why it matters</Label>
          <Textarea
            id="goal-intention"
            rows={3}
            value={form.intention}
            onChange={(event) => setForm({ ...form, intention: event.target.value })}
            placeholder="One sentence is enough."
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="goal-horizon">Horizon</Label>
            <Select
              id="goal-horizon"
              value={form.horizon}
              onChange={(event) => setForm({ ...form, horizon: event.target.value })}
            >
              <option value="short">Short term</option>
              <option value="long">Long term</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-due">By when</Label>
            <Input
              id="goal-due"
              type="date"
              value={form.due}
              onChange={(event) => setForm({ ...form, due: event.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add goal</Button>
        </div>
      </form>
    </Sheet>
  );
}

export default function GoalsPage() {
  const goals = usePlannerSelector((state) => state.goals);
  const hydrated = useHydrated();
  const [horizon, setHorizon] = useState<"all" | "short" | "long">("all");
  const [adding, setAdding] = useState(false);

  const visible = useMemo(
    () => goals.filter((goal) => !goal.archived && (horizon === "all" || goal.horizon === horizon)),
    [goals, horizon],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Where this is going"
        title="Goals"
        lede="Bigger than a task, smaller than a lifetime."
        aside={
          <div className="flex items-center gap-3">
            <SegmentedControl
              ariaLabel="Goal horizon"
              value={horizon}
              segments={[
                { value: "all", label: "All" },
                { value: "short", label: "Short" },
                { value: "long", label: "Long" },
              ]}
              onChange={setHorizon}
              className="border border-[var(--hairline)]"
            />
            <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="pl-2.5">
              <Plus size={15} strokeWidth={2} />
              New
            </Button>
          </div>
        }
      />

      {!hydrated ? (
        <Skeleton className="h-40 w-full" />
      ) : visible.length === 0 ? (
        <EmptyState
          variant="leaf"
          title="No goals here yet"
          body="Write down one thing you would like to be true in six months."
          action={<Button onClick={() => setAdding(true)}>Add a goal</Button>}
        />
      ) : (
        <AnimatePresence initial={false}>
          {visible.map((goal) => (
            <GoalBand key={goal.id} goal={goal} />
          ))}
        </AnimatePresence>
      )}

      <NewGoalSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
