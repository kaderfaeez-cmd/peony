import type { Aisle } from "@/types";

/** Ordered the way you actually walk a shop, not alphabetically. */
export const AISLES: Array<{ value: Aisle; label: string }> = [
  { value: "produce", label: "Fruit & veg" },
  { value: "bakery", label: "Bakery" },
  { value: "dairy", label: "Dairy & eggs" },
  { value: "meat", label: "Meat & fish" },
  { value: "pantry", label: "Pantry" },
  { value: "frozen", label: "Frozen" },
  { value: "drinks", label: "Drinks" },
  { value: "household", label: "Household" },
  { value: "other", label: "Anything else" },
];

export const AISLE_LABELS = Object.fromEntries(
  AISLES.map((aisle) => [aisle.value, aisle.label]),
) as Record<Aisle, string>;

const KEYWORDS: Array<[Aisle, RegExp]> = [
  [
    "produce",
    /apple|banana|lemon|lime|onion|garlic|tomato|potato|salad|lettuce|spinach|carrot|pepper|cucumber|avocado|berr|grape|orange|herb|basil|mushroom|broccoli|courgette|zucchini|ginger|chilli|fruit|veg/i,
  ],
  ["bakery", /bread|roll|bagel|croissant|bun|pita|wrap|tortilla|cake|pastry/i],
  ["dairy", /milk|cheese|butter|yog|yoghurt|yogurt|cream|egg|feta|mozzarella|parmesan/i],
  ["meat", /chicken|beef|mince|steak|lamb|pork|bacon|sausage|fish|salmon|tuna|prawn|shrimp/i],
  [
    "pantry",
    /rice|pasta|noodle|flour|sugar|salt|oil|vinegar|sauce|spice|tin|can|bean|lentil|stock|coffee|tea|cereal|oats|honey|peanut/i,
  ],
  ["frozen", /frozen|ice cream|peas|chips|fries/i],
  ["drinks", /water|juice|soda|cola|wine|beer|sparkling|lemonade/i],
  ["household", /soap|detergent|towel|tissue|cleaner|bin bag|shampoo|toothpaste|candle/i],
];

/** Best-effort guess so the aisle picker is usually already right. */
export function guessAisle(title: string): Aisle {
  for (const [aisle, pattern] of KEYWORDS) {
    if (pattern.test(title)) return aisle;
  }
  return "other";
}
