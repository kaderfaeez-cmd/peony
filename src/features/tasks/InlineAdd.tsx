"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useActions } from "@/lib/store/provider";
import type { TaskDraft } from "@/types";

/**
 * The lightest possible way in: one line, Enter, done. It mirrors the shape of a
 * task row so adding feels like writing the next line rather than opening a form.
 */
export function InlineAdd({
  draft,
  placeholder = "Add something",
  className,
}: {
  draft: TaskDraft;
  placeholder?: string;
  className?: string;
}) {
  const actions = useActions();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const title = value.trim();
    if (!title) return;
    actions.createTask({ ...draft, title });
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className={cn("group flex items-center gap-3.5 py-2", className)}>
      <motion.span
        aria-hidden
        animate={{
          borderColor: focused ? "#ff8fab" : "var(--hairline-strong)",
          rotate: focused ? 90 : 0,
        }}
        className="grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full border border-dashed"
      >
        <Plus size={11} strokeWidth={2} className={focused ? "text-blush-400" : "text-ink-faint"} />
      </motion.span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setValue("");
            inputRef.current?.blur();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint/70 focus:outline-none"
      />
    </form>
  );
}
