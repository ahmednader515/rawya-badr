"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

type NavItem =
  | { type: "lesson"; id: string; slug?: string | null; title: string }
  | { type: "quiz"; id: string; title: string };

type Props = {
  prevItem: NavItem | null;
  nextItem: NavItem | null;
  prevHref: string | null;
  nextHref: string | null;
  watchComplete: boolean;
  isStudent: boolean;
  isLastLesson?: boolean;
  certificateHref?: string | null;
};

export function LessonNavigationBar({
  prevItem,
  nextItem,
  prevHref,
  nextHref,
  watchComplete,
  isStudent,
  isLastLesson = false,
  certificateHref = null,
}: Props) {
  const t = useT();

  const nextBlocked =
    isStudent && !isLastLesson && nextItem != null && !watchComplete;

  return (
    <nav className="mt-8 flex w-full items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
      {prevItem && prevHref ? (
        <Link
          href={prevHref}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)]"
        >
          ←{" "}
          {prevItem.type === "lesson"
            ? t("courses.previousLesson", "Previous lesson")
            : t("courses.previousQuiz", "Previous quiz")}
        </Link>
      ) : (
        <span />
      )}

      {isStudent && isLastLesson && watchComplete && certificateHref ? (
        <Link
          href={certificateHref}
          className="rounded-[var(--radius-btn)] bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          🎓 {t("courses.getCertificate", "Get your certificate")} →
        </Link>
      ) : nextItem ? (
        nextBlocked ? (
          <div className="text-end">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-[var(--radius-btn)] bg-[var(--color-muted)]/30 px-4 py-3 text-sm font-medium text-[var(--color-muted)]"
            >
              {nextItem.type === "lesson"
                ? t("courses.nextLesson", "Next lesson")
                : t("courses.nextQuiz", "Next quiz")}{" "}
              →
            </button>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {t("courses.finishVideoFirstHint", "Finish watching the lesson first.")}
            </p>
          </div>
        ) : nextHref ? (
          <Link
            href={nextHref}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            {nextItem.type === "lesson"
              ? t("courses.nextLesson", "Next lesson")
              : t("courses.nextQuiz", "Next quiz")}{" "}
            →
          </Link>
        ) : null
      ) : null}
    </nav>
  );
}
