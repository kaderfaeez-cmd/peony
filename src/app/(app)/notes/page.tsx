"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pen, Pin, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { Markdown, toggleCheckboxLine } from "@/lib/markdown";
import { useActions, useHydrated, usePlannerSelector } from "@/lib/store/provider";

export default function NotesPage() {
  const notes = usePlannerSelector((state) => state.notes);
  const actions = useActions();
  const hydrated = useHydrated();
  const { notify } = useToast();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);

  const sorted = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...notes]
      .filter((note) => !needle || `${note.title} ${note.body}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, query]);

  const active = sorted.find((note) => note.id === activeId) ?? sorted[0] ?? null;

  useEffect(() => {
    if (!activeId && sorted[0]) setActiveId(sorted[0].id);
  }, [activeId, sorted]);

  const createNote = () => {
    actions.addNote({ title: "", body: "" });
    setPreview(false);
    setActiveId(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Somewhere to put it"
        title="Notes"
        lede="Lists, thoughts, half-formed plans. Markdown if you want it, plain words if you don't."
        aside={
          <Button size="sm" variant="outline" onClick={createNote} className="pl-2.5">
            <Plus size={15} strokeWidth={2} />
            New note
          </Button>
        }
      />

      {!hydrated ? (
        <Skeleton className="h-[420px] w-full" />
      ) : notes.length === 0 ? (
        <EmptyState
          variant="stem"
          title="No notes yet"
          body="A grocery list counts. So does one sentence you don't want to forget."
          action={<Button onClick={createNote}>Write the first one</Button>}
        />
      ) : (
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* ------------------------------------------------------- index */}
          <div className="lg:border-r lg:border-[var(--hairline)] lg:pr-6">
            <div className="mb-4 flex items-center gap-2 border-b border-[var(--hairline)] pb-2">
              <Search size={13} strokeWidth={1.7} className="text-ink-faint" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
                className="w-full bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>

            <ul className="scrollbar-quiet max-h-[62vh] space-y-0.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {sorted.map((note) => (
                  <motion.li key={note.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button
                      onClick={() => {
                        setActiveId(note.id);
                        setPreview(false);
                      }}
                      className={cn(
                        "w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors",
                        active?.id === note.id
                          ? "bg-blush-50 dark:bg-blush-600/15"
                          : "hover:bg-[color-mix(in_oklab,var(--paper-deep),transparent_40%)]",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {note.pinned ? (
                          <Pin size={11} strokeWidth={2} className="shrink-0 text-rose-ink" />
                        ) : null}
                        <span className="truncate text-[13.5px] text-ink">
                          {note.title || "Untitled"}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">
                        {note.body.split("\n").find(Boolean)?.replace(/[#*[\]]/g, "") || "Empty"}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* ------------------------------------------------------ editor */}
          {active ? (
            <div className="min-w-0">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-[11.5px] uppercase tracking-[0.16em] text-ink-faint">
                  {format(new Date(active.updatedAt), "d MMM · HH:mm")}
                </p>
                <div className="flex items-center gap-1">
                  <IconButton
                    label={preview ? "Edit note" : "Preview note"}
                    onClick={() => setPreview((current) => !current)}
                  >
                    {preview ? <Pen size={14} strokeWidth={1.7} /> : <Eye size={15} strokeWidth={1.7} />}
                  </IconButton>
                  <IconButton
                    label={active.pinned ? "Unpin note" : "Pin note"}
                    onClick={() => actions.updateNote(active.id, { pinned: !active.pinned })}
                    className={active.pinned ? "text-rose-ink" : ""}
                  >
                    <Pin size={14} strokeWidth={1.8} />
                  </IconButton>
                  <IconButton
                    label="Delete note"
                    onClick={() => {
                      const removed = actions.deleteNote(active.id);
                      setActiveId(null);
                      if (removed)
                        notify("Note deleted", {
                          label: "Undo",
                          run: () => actions.restoreNote(removed),
                        });
                    }}
                    className="hover:text-rose-ink"
                  >
                    <Trash2 size={14} strokeWidth={1.7} />
                  </IconButton>
                </div>
              </div>

              <input
                value={active.title}
                onChange={(event) => actions.updateNote(active.id, { title: event.target.value })}
                placeholder="Title"
                aria-label="Note title"
                className="w-full bg-transparent font-display text-[clamp(1.6rem,1.3rem+1vw,2.2rem)] leading-tight text-ink placeholder:text-ink-faint/60 focus:outline-none"
              />

              <div className="mt-6 min-h-[46vh]">
                {preview ? (
                  <Markdown
                    source={active.body}
                    onToggleCheckbox={(lineIndex) =>
                      actions.updateNote(active.id, { body: toggleCheckboxLine(active.body, lineIndex) })
                    }
                  />
                ) : (
                  <textarea
                    value={active.body}
                    onChange={(event) => actions.updateNote(active.id, { body: event.target.value })}
                    placeholder={"Start writing…\n\n- [ ] a checklist\n**bold**, *italic*, # heading"}
                    aria-label="Note body"
                    className="scrollbar-quiet h-[46vh] w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-ink-soft placeholder:text-ink-faint/60 focus:outline-none"
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
