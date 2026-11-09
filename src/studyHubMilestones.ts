/**
 * The quarter marks (25, 50, 75 per cent) that were passed when an activity went from `before` to `after` per cent
 * done. Reporting only these keeps a long activity to a few "progress" events instead of one per step.
 */
export function crossedMilestones(before: number, after: number): number[] {
  return [25, 50, 75].filter((mark) => before < mark && after >= mark);
}

/** Per cent done, from a count of finished steps out of the total, never above 100. */
export function percentDone(done: number, total: number): number {
  return total > 0 ? Math.min(100, (done / total) * 100) : 0;
}
