"use client";

import { useEffect, useState } from "react";
import { Label, Textarea } from "@/components/ui/Field";
import { usePlannerSelector, useActions } from "@/lib/store/provider";
import type { Reflection } from "@/types";

const PROMPTS = [
  { key: "wins", label: "What went well", placeholder: "Even the small things count." },
  { key: "lessons", label: "What was hard", placeholder: "No judgement — just noticing." },
  { key: "intention", label: "Next time", placeholder: "One gentle intention." },
] as const;

/** Three questions, autosaved. Reflection should never feel like paperwork. */
export function ReflectionPanel({ period, scope }: { period: string; scope: Reflection["scope"] }) {
  const stored = usePlannerSelector(
    (state) => state.reflections.find((item) => item.period === period) ?? null,
  );
  const actions = useActions();
  const [draft, setDraft] = useState({ wins: "", lessons: "", intention: "" });

  useEffect(() => {
    setDraft({
      wins: stored?.wins ?? "",
      lessons: stored?.lessons ?? "",
      intention: stored?.intention ?? "",
    });
  }, [period, stored?.wins, stored?.lessons, stored?.intention]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        draft.wins === (stored?.wins ?? "") &&
        draft.lessons === (stored?.lessons ?? "") &&
        draft.intention === (stored?.intention ?? "")
      ) {
        return;
      }
      actions.saveReflection(period, scope, draft);
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, period, scope, actions, stored]);

  return (
    <div className="grid gap-8 sm:grid-cols-3">
      {PROMPTS.map((prompt) => (
        <div key={prompt.key} className="space-y-2">
          <Label htmlFor={`${period}-${prompt.key}`}>{prompt.label}</Label>
          <Textarea
            id={`${period}-${prompt.key}`}
            rows={4}
            value={draft[prompt.key]}
            placeholder={prompt.placeholder}
            onChange={(event) => setDraft((current) => ({ ...current, [prompt.key]: event.target.value }))}
          />
        </div>
      ))}
    </div>
  );
}
