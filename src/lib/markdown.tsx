"use client";

import { Fragment, type ReactNode } from "react";

/**
 * A very small markdown subset, rendered to React elements rather than HTML —
 * no `dangerouslySetInnerHTML`, so a pasted note can never inject markup.
 *
 * Supports: # headings, - bullets, 1. numbers, - [ ] checkboxes, > quotes,
 * **bold**, *italic*, `code` and [links](https://…).
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return (
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded-[4px] bg-blush-50 px-1.5 py-0.5 text-[0.9em] text-[#8a3f5a] dark:bg-blush-600/15 dark:text-blush-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (link) {
      const [, label, href] = link;
      const safe = /^https?:\/\//i.test(href) ? href : "#";
      return (
        <a
          key={key}
          href={safe}
          target="_blank"
          rel="noreferrer noopener"
          className="text-rose-ink underline decoration-blush-200 underline-offset-2 hover:decoration-blush-600"
        >
          {label}
        </a>
      );
    }
    return <Fragment key={key}>{token}</Fragment>;
  });
}

export function Markdown({
  source,
  onToggleCheckbox,
}: {
  source: string;
  onToggleCheckbox?: (lineIndex: number) => void;
}) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length === 0) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-2 space-y-1 pl-1 text-[14.5px] leading-relaxed text-ink-soft ${
          ordered ? "list-inside list-decimal" : ""
        }`}
      >
        {list}
      </Tag>,
    );
    list = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();

    const checkbox = /^[-*]\s\[( |x|X)\]\s(.*)$/.exec(line);
    if (checkbox) {
      const [, mark, label] = checkbox;
      const checked = mark.toLowerCase() === "x";
      list.push(
        <li key={index} className="flex list-none items-start gap-2.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onToggleCheckbox?.(index)}
            className={`mt-[3px] grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border transition-colors ${
              checked ? "border-blush-600 bg-blush-600" : "border-[var(--hairline-strong)] hover:border-blush-400"
            }`}
          >
            {checked ? (
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5">
                <path
                  d="M5 12.6 10 17.4 19 7"
                  fill="none"
                  stroke="#33161f"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </button>
          <span className={checked ? "text-ink-faint line-through" : ""}>
            {renderInline(label, `c${index}`)}
          </span>
        </li>,
      );
      ordered = false;
      return;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      list.push(
        <li key={index} className="flex list-none items-start gap-2.5">
          <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blush-400" />
          <span>{renderInline(bullet[1], `b${index}`)}</span>
        </li>,
      );
      ordered = false;
      return;
    }

    const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (numbered) {
      ordered = true;
      list.push(
        <li key={index} className="pl-1">
          {renderInline(numbered[2], `n${index}`)}
        </li>,
      );
      return;
    }

    flush();

    if (!line.trim()) return;

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const sizes = ["text-[22px]", "text-[18px]", "text-[15.5px]"];
      blocks.push(
        <p
          key={index}
          className={`font-display ${sizes[level - 1]} mt-5 mb-1 leading-snug text-ink first:mt-0`}
        >
          {renderInline(heading[2], `h${index}`)}
        </p>,
      );
      return;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={index}
          className="my-3 border-l-2 border-blush-200 pl-4 text-[14.5px] italic leading-relaxed text-ink-soft"
        >
          {renderInline(line.slice(2), `q${index}`)}
        </blockquote>,
      );
      return;
    }

    blocks.push(
      <p key={index} className="my-2 text-[14.5px] leading-relaxed text-ink-soft">
        {renderInline(line, `p${index}`)}
      </p>,
    );
  });

  flush();

  return <div className="max-w-[68ch]">{blocks}</div>;
}

/** Flips `- [ ]` to `- [x]` (and back) on a single line of a note body. */
export function toggleCheckboxLine(source: string, lineIndex: number): string {
  const lines = source.split("\n");
  const line = lines[lineIndex];
  if (!line) return source;
  lines[lineIndex] = /\[\s\]/.test(line) ? line.replace("[ ]", "[x]") : line.replace(/\[[xX]\]/, "[ ]");
  return lines.join("\n");
}
