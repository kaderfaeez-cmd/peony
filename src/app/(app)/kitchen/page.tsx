"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { addDays, format, toKey, weekDays } from "@/lib/date";
import { useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import { DateNav } from "@/features/planner/DateNav";
import { ShoppingList } from "@/features/kitchen/ShoppingList";
import { WeeklyMenu } from "@/features/kitchen/WeeklyMenu";

export default function KitchenPage() {
  const settings = useSettings();
  const meals = usePlannerSelector((state) => state.meals);
  const hydrated = useHydrated();
  const [anchor, setAnchor] = useState(new Date());

  const days = useMemo(
    () => weekDays(anchor, settings.weekStartsMonday),
    [anchor, settings.weekStartsMonday],
  );

  const planned = useMemo(() => {
    const keys = new Set(days.map(toKey));
    return meals.filter((meal) => keys.has(meal.date) && meal.title.trim()).length;
  }, [days, meals]);

  return (
    <div>
      <PageHeader
        eyebrow={`${format(days[0], "d MMM")} – ${format(days[6], "d MMM")}`}
        title="Kitchen"
        lede={
          planned === 0
            ? "Nothing planned yet. Type what you feel like cooking, or take one of the suggestions."
            : `${planned} of 7 nights planned. The rest can stay undecided.`
        }
        aside={
          <DateNav
            unit="week"
            onPrevious={() => setAnchor(addDays(anchor, -7))}
            onNext={() => setAnchor(addDays(anchor, 7))}
            onReset={() => setAnchor(new Date())}
            resetLabel="This week"
          />
        }
      />

      {!hydrated ? (
        <Skeleton className="h-[420px] w-full" />
      ) : (
        <div className="grid gap-x-14 gap-y-12 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <h2 className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">
              This week&apos;s menu
            </h2>
            <WeeklyMenu days={days} />
          </section>

          <aside className="xl:border-l xl:border-[var(--hairline)] xl:pl-10">
            <ShoppingList />
          </aside>
        </div>
      )}
    </div>
  );
}
