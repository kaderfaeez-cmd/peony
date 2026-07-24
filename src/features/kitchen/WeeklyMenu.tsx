"use client";

import { motion } from "framer-motion";
import { isToday } from "date-fns";
import { Plus, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { format, toKey } from "@/lib/date";
import { useActions, usePlannerSelector } from "@/lib/store/provider";
import { guessAisle } from "./aisles";
import { suggestionFor } from "./suggestions";

/** Saves a beat after typing stops, so nothing needs a save button. */
const SAVE_DELAY = 600;

function DayRow({ date, onSendToList }: { date: Date; onSendToList: (title: string) => void }) {
  const key = toKey(date);
  const meal = usePlannerSelector((state) => state.meals.find((item) => item.date === key) ?? null);
  const actions = useActions();

  const [value, setValue] = useState(meal?.title ?? "");
  const [focused, setFocused] = useState(false);
  const [ideaOffset, setIdeaOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const stored = meal?.title ?? "";

  useEffect(() => setValue(stored), [stored, key]);

  useEffect(() => {
    if (value === stored) return;
    const timer = setTimeout(() => actions.setMeal(key, value), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [value, stored, key, actions]);

  const idea = suggestionFor(key, ideaOffset);
  const today = isToday(date);
  const empty = value.trim().length === 0;

  return (
    <div
      className={cn(
        "group grid grid-cols-[76px_minmax(0,1fr)] items-center gap-4 border-t border-[var(--hairline)] py-3.5 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-6",
        today && "bg-[color-mix(in_oklab,var(--color-blush-50),transparent_72%)]",
      )}
    >
      <div className="leading-tight">
        <p className={cn("text-[13.5px]", today ? "text-rose-ink" : "text-ink")}>
          {format(date, "EEEE")}
        </p>
        <p className="tabular text-[11px] text-ink-faint">{format(date, "d MMM")}</p>
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (value !== stored) actions.setMeal(key, value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setValue(stored);
            event.currentTarget.blur();
          }
          // Tab-like shortcut: accept the suggestion showing in the placeholder.
          if (event.key === "ArrowRight" && empty) setValue(idea);
        }}
        placeholder={focused ? "What are we cooking?" : idea}
        aria-label={`Meal for ${format(date, "EEEE d MMMM")}`}
        className={cn(
          "w-full bg-transparent py-1 font-display text-[17px] text-ink focus:outline-none",
          empty && !focused ? "placeholder:text-ink-faint/55 placeholder:italic" : "",
        )}
      />

      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
        {empty ? (
          <>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setValue(idea);
                actions.setMeal(key, idea);
              }}
              className="rounded-full px-2.5 py-1 text-[11.5px] text-ink-faint opacity-0 transition-colors hover:text-rose-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              Use this
            </motion.button>
            <motion.button
              whileTap={{ rotate: -90 }}
              onClick={() => setIdeaOffset((offset) => offset + 1)}
              aria-label={`Suggest something else for ${format(date, "EEEE")}`}
              className="grid h-7 w-7 place-items-center rounded-full text-ink-faint opacity-0 transition-colors hover:text-rose-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Shuffle size={13} strokeWidth={1.7} />
            </motion.button>
          </>
        ) : (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onSendToList(value.trim())}
            aria-label={`Add ${value.trim()} to the shopping list`}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] text-ink-faint opacity-0 transition-colors hover:text-rose-ink focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Plus size={12} strokeWidth={2} />
            To list
          </motion.button>
        )}
      </div>
    </div>
  );
}

/** Seven days, one line each. Empty days quietly suggest something. */
export function WeeklyMenu({ days }: { days: Date[] }) {
  const actions = useActions();

  const sendToList = (title: string) =>
    actions.addShoppingItem({ title, quantity: "", aisle: guessAisle(title) });

  return (
    <div>
      {days.map((day) => (
        <DayRow key={toKey(day)} date={day} onSendToList={sendToList} />
      ))}
    </div>
  );
}
