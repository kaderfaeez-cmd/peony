import { fromKey, todayKey } from "@/lib/date";

export interface Quote {
  line: string;
  source: string;
}

/**
 * Deliberately short lines — a quote block should read like a margin note,
 * not like a poster.
 */
export const QUOTES: Quote[] = [
  { line: "How we spend our days is, of course, how we spend our lives.", source: "Annie Dillard" },
  { line: "Almost everything will work again if you unplug it for a few minutes.", source: "Anne Lamott" },
  { line: "Little by little, one travels far.", source: "attributed to Tolkien" },
  { line: "You do not have to be good. You only have to let the soft animal of your body love what it loves.", source: "Mary Oliver" },
  { line: "Nothing is less real than realism. Details are confusing.", source: "Georgia O'Keeffe" },
  { line: "Begin again, as many times as you need to.", source: "a kind reminder" },
  { line: "The days are long but the decades are short.", source: "Sam Altman" },
  { line: "Tend the small things. The big things follow.", source: "a gardener" },
  { line: "It is not enough to be busy. The question is: what are we busy about?", source: "Henry David Thoreau" },
  { line: "Slow is smooth, and smooth is fast.", source: "an old saying" },
  { line: "Rest is not the reward for finishing. It is part of the work.", source: "a kind reminder" },
  { line: "Flowers grow back, even after they are stepped on. So will you.", source: "unknown" },
  { line: "You are allowed to be both a masterpiece and a work in progress.", source: "Sophia Bush" },
  { line: "Ordinary days are the ones that make up a life.", source: "a kind reminder" },
];

/** Same quote all day, a new one tomorrow — deterministic, no flicker. */
export function quoteOfDay(key = todayKey()): Quote {
  const day = Math.floor(fromKey(key).getTime() / 86_400_000);
  return QUOTES[((day % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
