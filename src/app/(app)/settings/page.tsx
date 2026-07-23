"use client";

import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SHORTCUTS } from "@/components/shell/Shortcuts";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toaster";
import { requestNotificationPermission } from "@/hooks/useReminders";
import { cn } from "@/lib/cn";
import { usePlanner } from "@/lib/store/provider";
import { clearStorage } from "@/lib/store/repository";
import { emptyState } from "@/lib/store/initial";
import { migrate } from "@/lib/store/repository";
import type { Category } from "@/types";

const TONES: Category["tone"][] = ["blush-50", "blush-100", "blush-200", "blush-400", "blush-600"];

export default function SettingsPage() {
  const { state, actions } = usePlanner();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [categoryName, setCategoryName] = useState("");
  const [tone, setTone] = useState<Category["tone"]>("blush-400");
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peony-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Planner exported");
  };

  const importData = async (file: File) => {
    try {
      const parsed = migrate(JSON.parse(await file.text()));
      if (!parsed) throw new Error("unrecognised file");
      actions.replaceAll(parsed);
      notify("Planner imported");
    } catch {
      notify("That file could not be read");
    }
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader eyebrow="Yours" title="Settings" lede="Small preferences, saved on this device." />

      <Section title="You">
        <div className="max-w-[320px] space-y-1.5">
          <Label htmlFor="settings-name">What should the app call you?</Label>
          <Input
            id="settings-name"
            value={state.settings.name}
            placeholder="Your name"
            onChange={(event) => actions.updateSettings({ name: event.target.value })}
          />
        </div>
      </Section>

      <Section title="Look and feel" className="mt-12">
        <div className="flex items-center justify-between gap-8 py-4">
          <div>
            <p className="text-[14px] text-ink">Theme</p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">Daylight paper, or dusk in the same roses.</p>
          </div>
          <SegmentedControl
            ariaLabel="Theme"
            value={state.settings.theme}
            segments={[
              { value: "light", label: "Daylight" },
              { value: "dark", label: "Dusk" },
            ]}
            onChange={(value) => actions.updateSettings({ theme: value })}
            className="border border-[var(--hairline)]"
          />
        </div>

        <div className="divide-y divide-[var(--hairline)]">
          <Toggle
            label="Moving background"
            description="A slow field of flowers behind everything. Turn it off to save battery."
            checked={state.settings.atmosphere}
            onChange={(value) => actions.updateSettings({ atmosphere: value })}
          />
          <Toggle
            label="Calm motion"
            description="Removes animation everywhere, for tired eyes and long days."
            checked={state.settings.calmMotion}
            onChange={(value) => actions.updateSettings({ calmMotion: value })}
          />
          <Toggle
            label="Week starts on Monday"
            checked={state.settings.weekStartsMonday}
            onChange={(value) => actions.updateSettings({ weekStartsMonday: value })}
          />
        </div>
      </Section>

      <Section title="Reminders and weather" className="mt-12">
        <div className="divide-y divide-[var(--hairline)]">
          <Toggle
            label="Task reminders"
            description="A browser notification when a timed task is due, while Peony is open."
            checked={state.settings.reminders}
            onChange={async (value) => {
              if (!value) {
                actions.updateSettings({ reminders: false });
                return;
              }
              const granted = await requestNotificationPermission();
              actions.updateSettings({ reminders: granted });
              if (!granted) notify("Notifications are blocked in your browser settings");
            }}
          />
          <Toggle
            label="Weather on the dashboard"
            description="Uses your location once per session. Nothing is stored or sent anywhere else."
            checked={state.settings.weather}
            onChange={(value) => actions.updateSettings({ weather: value })}
          />
        </div>
      </Section>

      <Section title="Focus timer" className="mt-12">
        <div className="grid max-w-[360px] grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="pomodoro-focus">Focus minutes</Label>
            <Select
              id="pomodoro-focus"
              value={state.settings.pomodoroFocus}
              onChange={(event) => actions.updateSettings({ pomodoroFocus: Number(event.target.value) })}
            >
              {[15, 20, 25, 30, 45, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pomodoro-break">Break minutes</Label>
            <Select
              id="pomodoro-break"
              value={state.settings.pomodoroBreak}
              onChange={(event) => actions.updateSettings({ pomodoroBreak: Number(event.target.value) })}
            >
              {[3, 5, 10, 15].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Categories" className="mt-12">
        <div className="flex flex-wrap gap-2">
          {state.categories.map((category) => (
            <span
              key={category.id}
              className="group flex items-center gap-2 rounded-full border border-[var(--hairline)] py-1 pl-3 pr-1.5 text-[12.5px] text-ink-soft"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: `var(--color-${category.tone})` }}
              />
              {category.name}
              {!category.system ? (
                <IconButton
                  label={`Remove ${category.name}`}
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => actions.removeCategory(category.id)}
                >
                  <Trash2 size={11} strokeWidth={1.8} />
                </IconButton>
              ) : null}
            </span>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!categoryName.trim()) return;
            actions.addCategory(categoryName.trim(), tone);
            setCategoryName("");
          }}
          className="mt-6 flex flex-wrap items-end gap-4"
        >
          <div className="w-[200px] space-y-1.5">
            <Label htmlFor="category-name">New category</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Book club"
            />
          </div>
          <div className="flex items-center gap-1.5 pb-2">
            {TONES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                aria-label={value}
                aria-pressed={tone === value}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-transform",
                  tone === value ? "scale-110 border-ink-faint" : "border-transparent",
                )}
                style={{ backgroundColor: `var(--color-${value})` }}
              />
            ))}
          </div>
          <Button type="submit" size="sm" variant="outline" className="pl-2.5">
            <Plus size={14} strokeWidth={2} />
            Add
          </Button>
        </form>
      </Section>

      <Section title="Your data" className="mt-12">
        <p className="mb-5 max-w-[52ch] text-[13.5px] leading-relaxed text-ink-soft">
          Everything lives in this browser. Export a copy before switching device or clearing history.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportData} className="pl-2.5">
            <Download size={14} strokeWidth={1.8} />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="pl-2.5">
            <Upload size={14} strokeWidth={1.8} />
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importData(file);
              event.target.value = "";
            }}
          />

          <button
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 5000);
                return;
              }
              clearStorage();
              actions.replaceAll(emptyState());
              setConfirmReset(false);
              notify("Everything cleared");
            }}
            className={cn(
              "ml-auto rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
              confirmReset ? "bg-blush-600 text-[#33161f]" : "text-ink-faint hover:text-rose-ink",
            )}
          >
            {confirmReset ? "Tap again to erase everything" : "Start over"}
          </button>
        </div>
      </Section>

      <Section title="Keyboard" className="mt-12">
        <ul className="grid grid-cols-1 gap-y-2 sm:grid-cols-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="flex items-center gap-3 text-[13px]">
              <kbd className="grid h-6 min-w-6 place-items-center rounded-[6px] border border-[var(--hairline-strong)] px-1.5 text-[11px] text-ink-soft">
                {shortcut.keys}
              </kbd>
              <span className="text-ink-soft">{shortcut.action}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
