/** Short, sortable-enough, collision-safe id. */
export function createId(prefix = "p"): string {
  const stamp = Date.now().toString(36);
  const noise =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${stamp}${noise}`;
}
