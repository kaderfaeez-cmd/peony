"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { useActions, usePlannerSelector } from "@/lib/store/provider";
import type { Aisle, ShoppingItem } from "@/types";
import { AISLES, AISLE_LABELS, guessAisle } from "./aisles";

function QuickAdd() {
  const actions = useActions();
  const [title, setTitle] = useState("");
  const [aisle, setAisle] = useState<Aisle | null>(null);

  const guessed = aisle ?? (title.trim() ? guessAisle(title) : "other");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    // "2 lemons" — pull a leading quantity out so the list stays tidy.
    const match = /^(\d+(?:[.,]\d+)?\s*[a-z]*)\s+(.+)$/i.exec(trimmed);
    const quantity = match ? match[1] : "";
    const name = match ? match[2] : trimmed;

    actions.addShoppingItem({ title: name, quantity, aisle: aisle ?? guessAisle(name) });
    setTitle("");
    setAisle(null);
  };

  return (
    <form onSubmit={submit} className="border-b border-[var(--hairline)] pb-3">
      <div className="flex items-center gap-2.5">
        <motion.span
          aria-hidden
          animate={{ rotate: title ? 90 : 0, borderColor: title ? "#ff8fab" : "var(--hairline-strong)" }}
          className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border border-dashed"
        >
          <Plus size={10} strokeWidth={2} className={title ? "text-blush-400" : "text-ink-faint"} />
        </motion.span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add something — “2 lemons”"
          aria-label="Add to the shopping list"
          className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-faint/70 focus:outline-none"
        />
      </div>

      <AnimatePresence>
        {title.trim() ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pt-3">
              {AISLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAisle(option.value)}
                  className={cn(
                    "rounded-full border px-2.5 py-[3px] text-[11px] transition-colors",
                    guessed === option.value
                      ? "border-blush-400 text-rose-ink"
                      : "border-[var(--hairline)] text-ink-faint hover:text-ink-soft",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function Row({ item }: { item: ShoppingItem }) {
  const actions = useActions();
  const { notify } = useToast();

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-3 py-[5px]"
    >
      <Checkbox
        size={18}
        checked={item.done}
        onChange={() => actions.toggleShoppingItem(item.id)}
        label={item.title}
      />
      <span
        className={cn(
          "flex-1 text-[14px]",
          item.done ? "text-ink-faint line-through decoration-blush-200" : "text-ink-soft",
        )}
      >
        {item.title}
        {item.quantity ? (
          <span className="ml-2 tabular text-[11.5px] text-ink-faint">{item.quantity}</span>
        ) : null}
      </span>
      <IconButton
        label={`Remove ${item.title}`}
        className="opacity-0 group-hover:opacity-100"
        onClick={() => {
          const removed = actions.deleteShoppingItem(item.id);
          if (removed)
            notify("Removed", { label: "Undo", run: () => actions.restoreShoppingItems([removed]) });
        }}
      >
        <Trash2 size={12} strokeWidth={1.7} />
      </IconButton>
    </motion.li>
  );
}

/** The list, grouped the way the shop is laid out. */
export function ShoppingList() {
  const shopping = usePlannerSelector((state) => state.shopping);
  const actions = useActions();
  const { notify } = useToast();

  const { groups, ticked, left } = useMemo(() => {
    const open = shopping.filter((item) => !item.done);
    const done = shopping.filter((item) => item.done);
    const byAisle = AISLES.map((aisle) => ({
      ...aisle,
      items: open.filter((item) => item.aisle === aisle.value),
    })).filter((group) => group.items.length > 0);

    return { groups: byAisle, ticked: done, left: open.length };
  }, [shopping]);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[19px] text-ink">To buy</h2>
        <span className="tabular text-[11.5px] text-ink-faint">
          {left === 0 ? "all done" : `${left} left`}
        </span>
      </div>

      <QuickAdd />

      {shopping.length === 0 ? (
        <p className="py-6 text-[13px] leading-relaxed text-ink-soft">
          Nothing on the list. Add things as you think of them, or send a meal over from the menu.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.value}>
              <h3 className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {group.label}
              </h3>
              <ul>
                <AnimatePresence initial={false}>
                  {group.items.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}

          {ticked.length > 0 ? (
            <section className="border-t border-[var(--hairline)] pt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  In the basket
                </h3>
                <button
                  onClick={() => {
                    const removed = actions.clearTickedShopping();
                    if (removed.length > 0)
                      notify(`${removed.length} cleared`, {
                        label: "Undo",
                        run: () => actions.restoreShoppingItems(removed),
                      });
                  }}
                  className="text-[11.5px] text-ink-faint transition-colors hover:text-rose-ink"
                >
                  Clear
                </button>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {ticked.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <p className="mt-6 text-[11.5px] leading-relaxed text-ink-faint">
        {AISLE_LABELS.produce} first, {AISLE_LABELS.household.toLowerCase()} last — the list is sorted
        the way you walk the shop.
      </p>
    </div>
  );
}
