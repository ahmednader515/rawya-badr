import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import { buildOrderedContentItems } from "@/lib/lesson-sequence";

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = course.slug && course.slug.trim() ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : (course as { id: string }).id;
}

function lessonHref(
  course: { slug?: string | null; id: string },
  lesson: { slug?: string | null; id: string },
): string {
  const seg = courseSeg(course);
  const lessonSeg =
    lesson.slug && lesson.slug.trim() ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  return `/courses/${courseSeg(course)}/quizzes/${encodeURIComponent(quizId)}`;
}

type Props = {
  course: { id: string; slug?: string | null };
  lessons: Array<
    Record<string, unknown> & { id: string; title?: string; titleAr?: string | null; order?: number }
  >;
  quizzes: Array<
    Record<string, unknown> & {
      id: string;
      title?: string;
      order?: number;
      _count?: { questions?: number };
    }
  >;
  currentLessonId?: string | null;
  currentQuizId?: string | null;
  unlockedLessonIds?: string[] | null;
  unlockedQuizIds?: string[] | null;
};

export async function CourseOutlineSidebar({
  course,
  lessons,
  quizzes,
  currentLessonId,
  currentQuizId,
  unlockedLessonIds,
  unlockedQuizIds,
}: Props) {
  const t = await getServerTranslator();
  const unlockedLessons =
    unlockedLessonIds != null ? new Set(unlockedLessonIds) : null;
  const unlockedQuizzes =
    unlockedQuizIds != null ? new Set(unlockedQuizIds) : null;

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const quizById = new Map(quizzes.map((q) => [q.id, q]));
  const ordered = buildOrderedContentItems({
    lessons: lessons.map((l) => ({
      id: l.id,
      order: typeof l.order === "number" ? l.order : null,
    })),
    quizzes: quizzes.map((q) => ({
      id: q.id,
      order: typeof q.order === "number" ? q.order : null,
    })),
  });

  return (
    <div className="sticky top-24 w-full max-w-[200px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {t("courses.courseContent", "Course content")}
      </h2>
      <ul className="space-y-0.5">
        {ordered.map((item, i) => {
          if (item.type === "lesson") {
            const l = lessonById.get(item.id);
            if (!l) return null;
            const isCurrent = l.id === currentLessonId;
            const isLocked = unlockedLessons != null && !unlockedLessons.has(l.id);
            const title = String(
              (l as Record<string, unknown>).titleAr ?? (l as Record<string, unknown>).title ?? "",
            );
            const className = `block rounded-[var(--radius-btn)] px-2 py-1.5 text-xs transition ${
              isCurrent
                ? "bg-[var(--color-primary)]/15 font-medium text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                : isLocked
                  ? "cursor-not-allowed text-[var(--color-muted)] opacity-60"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
            }`;
            return (
              <li key={`l-${l.id}`}>
                {isLocked ? (
                  <span
                    className={className}
                    title={t("courses.contentLocked", "Complete the previous item first")}
                  >
                    <span className="ml-1.5 text-[var(--color-muted)]">{i + 1}</span>
                    <span className="ml-1 opacity-70">🔒</span>
                    <span>{title}</span>
                  </span>
                ) : (
                  <Link href={lessonHref(course, l)} className={className}>
                    <span className="ml-1.5 text-[var(--color-muted)]">{i + 1}</span>
                    <span>{title}</span>
                  </Link>
                )}
              </li>
            );
          }

          const q = quizById.get(item.id);
          if (!q) return null;
          const isCurrent = q.id === currentQuizId;
          const isLocked = unlockedQuizzes != null && !unlockedQuizzes.has(q.id);
          const title = String((q as Record<string, unknown>).title ?? "");
          const qCount = (q as { _count?: { questions?: number } })._count;
          const count =
            qCount != null && typeof qCount === "object" && "questions" in qCount
              ? Number(qCount.questions) || 0
              : 0;
          const className = `block rounded-[var(--radius-btn)] px-2 py-1.5 text-xs transition ${
            isCurrent
              ? "bg-[var(--color-primary)]/15 font-medium text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
              : isLocked
                ? "cursor-not-allowed text-[var(--color-muted)] opacity-60"
                : "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
          }`;
          return (
            <li key={`q-${q.id}`}>
              {isLocked ? (
                <span
                  className={className}
                  title={t("courses.contentLocked", "Complete the previous item first")}
                >
                  <span className="ml-1.5 text-[var(--color-muted)]">{i + 1}</span>
                  <span className="ml-1 opacity-70">🔒</span>
                  <span className="ml-1 text-[var(--color-muted)]">
                    {t("courses.testPrefix", "Quiz:")}
                  </span>
                  <span>{title}</span>
                </span>
              ) : (
                <Link href={quizHref(course, q.id)} className={className}>
                  <span className="ml-1.5 text-[var(--color-muted)]">{i + 1}</span>
                  <span className="ml-1 text-[var(--color-muted)]">
                    {t("courses.testPrefix", "Quiz:")}
                  </span>
                  <span>{title}</span>
                  {count > 0 && (
                    <span className="mr-0.5 text-[10px] text-[var(--color-muted)]">({count})</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
