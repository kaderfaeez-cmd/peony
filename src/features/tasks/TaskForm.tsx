"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FieldRow, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { todayKey } from "@/lib/date";
import { usePlannerSelector } from "@/lib/store/provider";
import type { Task, TaskDraft } from "@/types";
import {
  DAY_PARTS,
  PRIORITY_LABELS,
  REPEAT_LABELS,
  taskSchema,
  type TaskFormOutput,
  type TaskFormValues,
} from "./schema";

export function TaskForm({
  defaults,
  submitLabel = "Add task",
  onSubmit,
  onCancel,
}: {
  defaults?: TaskDraft | Task | null;
  submitLabel?: string;
  onSubmit: (values: TaskDraft) => void;
  onCancel?: () => void;
}) {
  const categories = usePlannerSelector((state) => state.categories);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    // Input values (dates may be "") differ from parsed output (nulls), so the
    // resolver's transformed type is declared explicitly.
  } = useForm<TaskFormValues, unknown, TaskFormOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaults?.title ?? "",
      description: defaults?.description ?? "",
      notes: defaults?.notes ?? "",
      categoryId: defaults?.categoryId ?? "personal",
      priority: defaults?.priority ?? "medium",
      dayPart: defaults?.dayPart ?? "morning",
      date: defaults?.date ?? todayKey(),
      time: defaults?.time ?? "",
      due: defaults?.due ?? "",
      repeat: defaults?.repeat ?? "none",
    },
  });

  const dayPart = watch("dayPart");
  const priority = watch("priority");

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values as TaskDraft))}
      className="space-y-7"
      noValidate
    >
      <FieldRow>
        <Label htmlFor="task-title">What needs doing</Label>
        <Input
          id="task-title"
          placeholder="Water the plants"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "task-title-error" : undefined}
          className="font-display text-[19px]"
          {...register("title")}
        />
        {errors.title ? (
          <p id="task-title-error" className="text-[12px] text-rose-ink">
            {errors.title.message}
          </p>
        ) : null}
      </FieldRow>

      <FieldRow>
        <Label>Part of day</Label>
        <SegmentedControl
          ariaLabel="Part of day"
          value={dayPart ?? "morning"}
          segments={DAY_PARTS.map((part) => ({ value: part.value, label: part.label }))}
          onChange={(value) => setValue("dayPart", value, { shouldDirty: true })}
          className="-ml-1 border border-[var(--hairline)]"
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-5">
        <FieldRow>
          <Label htmlFor="task-date">Day</Label>
          <Input id="task-date" type="date" {...register("date")} />
        </FieldRow>
        <FieldRow>
          <Label htmlFor="task-time">Time</Label>
          <Input id="task-time" type="time" {...register("time")} />
        </FieldRow>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <FieldRow>
          <Label htmlFor="task-category">Category</Label>
          <Select id="task-category" {...register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow>
          <Label htmlFor="task-repeat">Repeats</Label>
          <Select id="task-repeat" {...register("repeat")}>
            {Object.entries(REPEAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldRow>
      </div>

      <FieldRow>
        <Label>Weight</Label>
        <SegmentedControl
          ariaLabel="Priority"
          value={priority ?? "medium"}
          segments={(Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map((value) => ({
            value,
            label: PRIORITY_LABELS[value],
          }))}
          onChange={(value) => setValue("priority", value, { shouldDirty: true })}
          className="-ml-1 border border-[var(--hairline)]"
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-5">
        <FieldRow>
          <Label htmlFor="task-due">Deadline</Label>
          <Input id="task-due" type="date" {...register("due")} />
        </FieldRow>
      </div>

      <FieldRow>
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" rows={3} placeholder="Anything worth remembering" {...register("notes")} />
      </FieldRow>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
