/**
 * Level (100, 200, 300, 400) maps to Year 1, 2, 3, 4 for display.
 * Backend and API continue to use numeric levels.
 */
export const LEVELS = [100, 200, 300, 400] as const;
export type Level = (typeof LEVELS)[number];

/** Convert level (100,200,300,400) to display label "Year 1", "Year 2", etc. */
export function levelToYearLabel(level: number | null | undefined): string {
  if (level == null) return 'Not set';
  const year = level / 100;
  return `Year ${year}`;
}

/** Get year number from level (100 -> 1, 200 -> 2, etc.) */
export function levelToYear(level: number): number {
  return level / 100;
}
