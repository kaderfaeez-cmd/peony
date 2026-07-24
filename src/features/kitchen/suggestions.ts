import { fromKey } from "@/lib/date";

/**
 * Homely, unfussy things to cook. Deliberately not a recipe database — the point
 * is to break the blank-page moment, not to plan someone's nutrition.
 */
export const MEAL_IDEAS = [
  "Lemon butter pasta",
  "Roast chicken and potatoes",
  "Tomato soup and toasted cheese",
  "Chickpea curry with rice",
  "Baked salmon, greens, lemon",
  "Mushroom risotto",
  "Beef stew, slow and quiet",
  "Shakshuka with warm bread",
  "Thai green curry",
  "Spaghetti bolognese",
  "Butter chicken",
  "Greek salad and pita",
  "Sweet potato and black bean tacos",
  "Pesto gnocchi",
  "Sunday roast, small version",
  "Fried rice with whatever's left",
  "Creamy garlic pasta",
  "Grilled cheese and tomato",
  "Ramen with a soft egg",
  "Lasagne, made in advance",
  "Falafel bowls",
  "Prawn linguine",
  "Chicken and rice soup",
  "Veggie stir fry with noodles",
  "Homemade pizza night",
  "Steak, mash and greens",
  "Lentil dahl",
  "Breakfast for dinner",
  "Stuffed peppers",
  "Fish tacos with slaw",
  "Mac and cheese, properly baked",
  "Couscous with roasted veg",
  "Teriyaki salmon bowls",
  "Cottage pie",
  "Caprese and crusty bread",
  "Katsu curry",
  "Chicken souvlaki wraps",
  "Minestrone",
  "Aubergine parmigiana",
  "Leftovers, and no guilt",
] as const;

/**
 * Stable per day: the same empty Tuesday shows the same idea all day rather than
 * shuffling on every keystroke.
 */
export function suggestionFor(dayKey: string, offset = 0): string {
  const day = Math.floor(fromKey(dayKey).getTime() / 86_400_000);
  const index = (((day * 7 + offset) % MEAL_IDEAS.length) + MEAL_IDEAS.length) % MEAL_IDEAS.length;
  return MEAL_IDEAS[index];
}

export function randomIdea(): string {
  return MEAL_IDEAS[Math.floor(Math.random() * MEAL_IDEAS.length)];
}
