/**
 * What Study Hub should be told when a student's progress changes, and what it should be told about the progress
 * they already have when they arrive.
 *
 * Progress can grow in several ways: a lesson round is finished, a topic is practised until it counts as known, an
 * old quiz round is completed. All of them end in the same place (the saved progress changes), so the reports are
 * worked out from the change itself instead of from each place that causes one. A topic is reported as completed
 * once, when it first becomes finished, however it got there.
 *
 * Only fixed names and numbers are reported, never anything the student typed.
 */

import { getChapters } from "@/content/chapters";
import { getTopics } from "@/content/topics";
import { uiMessages } from "@/lib/i18n";
import type { Lang } from "@/lib/lang";
import { EMPTY_PROGRESS, finishedTopics, levelOf, overallProgress, type Progress } from "@/lib/progress";
import type { ProgressDetails, ProgressKind } from "./studyHubProgress";

export interface HubReport {
  readonly kind: ProgressKind;
  readonly details: ProgressDetails;
}

/** The reports for a change from `before` to `after`: topics and chapters finished, overall progress, a new level. */
export function progressEvents(before: Progress, after: Progress, lang: Lang): HubReport[] {
  const reports: HubReport[] = [];
  const topics = getTopics(lang);
  const wasDone = finishedTopics(before);
  const isDone = finishedTopics(after);

  for (const topic of topics) {
    if (isDone.includes(topic.id) && !wasDone.includes(topic.id)) {
      reports.push({ kind: "completed", details: { label: topic.title, ref: `lesson-${topic.id}` } });
    }
  }

  for (const chapter of getChapters(lang)) {
    const allNow = chapter.lessons.every((lesson) => isDone.includes(lesson.id));
    const allBefore = chapter.lessons.every((lesson) => wasDone.includes(lesson.id));
    if (allNow && !allBefore) reports.push({ kind: "completed", details: { label: chapter.title, ref: `chapter-${chapter.id}` } });
  }

  // The one number that says how far along a student is. It only goes up here; resetting progress is not progress.
  const percentBefore = overallProgress(before, topics.length);
  const percentAfter = overallProgress(after, topics.length);
  if (percentAfter > percentBefore) {
    reports.push({ kind: "progress", details: { label: uiMessages(lang).home.overall, ref: "overall", value: percentAfter } });
  }

  const reached = levelOf(after.xp);
  if (reached > levelOf(before.xp)) reports.push({ kind: "level", details: { label: `Level ${reached}`, ref: "xp-level", value: reached } });

  return reports;
}

/**
 * Everything a student has already earned, as reports: for the first visit from Study Hub, so that what was done
 * before the student came that way is saved too. The same names are used as when it was earned, so Study Hub can
 * tell it is the same thing.
 */
export function snapshotEvents(progress: Progress, lang: Lang): HubReport[] {
  return progressEvents(EMPTY_PROGRESS, progress, lang);
}
