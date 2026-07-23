"use client";

import { isToday } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TaskSkeleton } from "@/components/ui/Skeleton";
import { DayPlanner } from "@/features/planner/DayPlanner";
import { DateNav } from "@/features/planner/DateNav";
import { addDays, format, fromKey, toKey, todayKey } from "@/lib/date";
import { useHydrated, usePlannerSelector } from "@/lib/store/provider";
import { completion, tasksOn } from "@/lib/store/selectors";
import { useDailyCelebration } from "@/hooks/useDailyCelebration";

function DailyPlanner() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const tasks = usePlannerSelector((state) => state.tasks);
  const [date, setDate] = useState<string>(todayKey());

  // The URL is the source of truth so a day can be linked to from anywhere.
  useEffect(() => {
    const requested = params.get("d");
    setDate(requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayKey());
  }, [params]);

  const day = fromKey(date);
  const dayTasks = useMemo(() => tasksOn(tasks, date), [tasks, date]);
  const stats = useMemo(() => completion(dayTasks), [dayTasks]);
  const viewingToday = isToday(day);

  useDailyCelebration(viewingToday ? dayTasks : []);

  return (
    <div>
      <PageHeader
        eyebrow={viewingToday ? "Today" : format(day, "EEEE")}
        title={format(day, "d MMMM")}
        lede={
          stats.total === 0
            ? "An empty page. Fill as much or as little of it as you like."
            : `${stats.done} of ${stats.total} done.`
        }
        aside={
          <div className="flex items-center gap-6">
            <DateNav
              unit="day"
              showReset={!viewingToday}
              onPrevious={() => setDate(toKey(addDays(day, -1)))}
              onNext={() => setDate(toKey(addDays(day, 1)))}
              onReset={() => setDate(todayKey())}
            />
            <ProgressRing value={stats.ratio} size={92} label={viewingToday ? "Today" : "Day"} />
          </div>
        }
      />

      {hydrated ? <DayPlanner date={date} /> : <TaskSkeleton rows={5} />}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TaskSkeleton rows={5} />}>
      <DailyPlanner />
    </Suspense>
  );
}
