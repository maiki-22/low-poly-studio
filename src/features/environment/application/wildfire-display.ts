// Display choices only: observed counts and totals always remain unchanged.
export const FIRE_MINIMUM_OPTIONS = [1, 25, 50, 100, 150] as const;
export const DEFAULT_FIRE_MINIMUM = 50;

export function meetsFireMinimum(
  count: number | null | undefined,
  minimum = DEFAULT_FIRE_MINIMUM,
): boolean {
  return count != null && count > 0 && count >= minimum;
}
