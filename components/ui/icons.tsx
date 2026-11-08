import {
  ArrowLeftRight,
  CalendarCheck,
  CircleHelp,
  Divide,
  Flame,
  Footprints,
  GraduationCap,
  ClipboardCheck,
  Infinity,
  ListChecks,
  MessageSquareText,
  Parentheses,
  PenLine,
  Puzzle,
  RotateCcw,
  Scale,
  Search,
  SearchX,
  Timer,
  ToggleLeft,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { TopicIconName } from "@/content/topics";
import type { ModeId, TaskGroup } from "@/lib/tasks";

/**
 * Every icon in MathLab is a Lucide icon. Emojis are never used as icons.
 * Icons are listed explicitly (instead of looked up by name) so the bundle
 * only contains the ones that are actually used.
 */

const TOPIC_ICONS: Record<TopicIconName, LucideIcon> = {
  Scale,
  Search,
  Footprints,
  ArrowLeftRight,
  Parentheses,
  TrendingUp,
  MessageSquareText,
  Divide,
  Infinity,
  Puzzle,
  Flame,
};

const MODE_ICONS: Record<ModeId, LucideIcon> = {
  daily: CalendarCheck,
  quiz: ListChecks,
  solve: PenLine,
  truefalse: ToggleLeft,
  step: Footprints,
  mistake: SearchX,
  equation: MessageSquareText,
  time: Timer,
  exam: GraduationCap,
  test: ClipboardCheck,
  mistakes: RotateCcw,
};

export function TopicIcon({ name, size = 22 }: { name: TopicIconName; size?: number }) {
  const Icon = TOPIC_ICONS[name] ?? CircleHelp;
  return <Icon size={size} aria-hidden="true" />;
}

export function ModeIcon({ id, size = 22 }: { id: ModeId; size?: number }) {
  const Icon = MODE_ICONS[id] ?? CircleHelp;
  return <Icon size={size} aria-hidden="true" />;
}

const GROUP_ICONS: Record<TaskGroup, LucideIcon> = {
  quiz: ListChecks,
  solve: PenLine,
  check: ToggleLeft,
  step: Footprints,
  mistake: SearchX,
  equation: MessageSquareText,
};

export function GroupIcon({ group, size = 18 }: { group: TaskGroup; size?: number }) {
  const Icon = GROUP_ICONS[group] ?? CircleHelp;
  return <Icon size={size} aria-hidden="true" />;
}
