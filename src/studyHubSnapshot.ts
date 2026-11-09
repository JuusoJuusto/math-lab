/**
 * A student who comes from Study Hub may already have progress in this browser from before. It is reported once, at
 * the start of the visit, so that Study Hub has all of it and not only what is done from now on.
 *
 * It is only for a visit that came from Study Hub (the token is kept for the visit), and only once for it: the next
 * page of the same visit does not tell it again. The names are the ones used when the progress was earned, so Study
 * Hub can tell it is the same thing and not something new.
 */

import type { Lang } from "@/lib/lang";
import type { Progress } from "@/lib/progress";
import { snapshotEvents } from "./studyHubChanges";
import { reportProgress } from "./studyHubProgress";

const TOKEN_KEY = "studyhub_token";
const DONE_KEY = "studyhub_snapshot";

/** Reports what the student has earned so far. Returns true when it did, false when there was nothing to do. */
export function reportSnapshotOnce(progress: Progress, lang: Lang): boolean {
  try {
    if (sessionStorage.getItem(TOKEN_KEY) === null) return false;
    if (sessionStorage.getItem(DONE_KEY) !== null) return false;
    sessionStorage.setItem(DONE_KEY, "1");
  } catch {
    return false;
  }
  for (const report of snapshotEvents(progress, lang)) reportProgress(report.kind, report.details);
  return true;
}
