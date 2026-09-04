import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  getAllowedQuizIdsForUserCourse,
  getUserCompletedQuizIdsInCourse,
} from "@/lib/db";
import { CourseOutlineSidebar } from "@/components/CourseOutlineSidebar";
import {
  buildOrderedContentItems,
  getUnlockedContentForStudent,
} from "@/lib/lesson-sequence";
import { QuizPageClient } from "./QuizPageClient";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string; quizId: string }> };

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = course.slug && course.slug.trim() ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : course.id;
}

function courseHref(course: { slug?: string | null; id: string }): string {
  return `/courses/${courseSeg(course)}`;
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

type CourseItem =
  | { type: "lesson"; id: string; slug?: string | null }
  | { type: "quiz"; id: string };

export default async function QuizPage({ params }: Props) {
  const t = await getServerTranslator();
  const { slug: courseSegment, quizId } = await params;
  const courseDecoded = decodeSegment(courseSegment);
  const session = await getServerSession(authOptions);

  const data = await getCourseWithContent(courseDecoded);
  if (!data?.course) notFound();

  const course = data.course as unknown as Record<string, unknown> & {
    id: string;
    lessons: Record<string, unknown>[];
    quizzes?: Array<Record<string, unknown> & { _count?: { questions?: number }; order?: number }>;
  };
  course.lessons = data.lessons;
  course.quizzes = data.quizzes ?? [];

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const isStudent = session?.user?.role === "STUDENT";

  let canAccess = isStaff;
  let isEnrolled = false;
  let hasFullStudentAccess = false;
  let allowedQuizIds: string[] = [];
  if (session?.user?.id) {
    const en = await getEnrollment(session.user.id, course.id);
    isEnrolled = !!en;
    if (en) canAccess = true;
    else if (session.user.role === "STUDENT") {
      hasFullStudentAccess = await hasFullCourseAccessAsStudent(session.user.id, course.id);
      canAccess = hasFullStudentAccess;
      if (!canAccess) {
        allowedQuizIds = await getAllowedQuizIdsForUserCourse(session.user.id, course.id);
        canAccess = allowedQuizIds.includes(quizId);
      }
    }
  }
  if (!canAccess) notFound();

  const quizExists = (course.quizzes ?? []).some((q) => q.id === quizId);
  if (!quizExists) notFound();

  const lessons = (course.lessons ?? []) as Array<
    Record<string, unknown> & { id: string; slug?: string | null; order?: number; title?: string }
  >;
  const quizzes = (course.quizzes ?? []) as Array<
    Record<string, unknown> & {
      id: string;
      order?: number;
      title?: string;
      _count?: { questions?: number };
    }
  >;

  const sequenceLessons = lessons.map((l) => ({
    id: String(l.id),
    order: typeof l.order === "number" ? l.order : null,
  }));
  const sequenceQuizzes = quizzes.map((q) => ({
    id: String(q.id),
    order: typeof q.order === "number" ? q.order : null,
  }));

  let unlockedLessonIds: string[] | null = null;
  let unlockedQuizIds: string[] | null = null;
  if (isStudent && session?.user?.id) {
    const unlocked = await getUnlockedContentForStudent({
      userId: session.user.id,
      role: session.user.role,
      courseLessons: sequenceLessons,
      courseQuizzes: sequenceQuizzes,
      courseId: course.id,
      allowedQuizIds:
        !isEnrolled && !hasFullStudentAccess && allowedQuizIds.length > 0
          ? allowedQuizIds
          : null,
    });
    unlockedLessonIds = [...unlocked.unlockedLessonIds];
    unlockedQuizIds = [...unlocked.unlockedQuizIds];
    if (!unlocked.unlockedQuizIds.has(quizId)) {
      redirect(courseHref(course));
    }
  }

  const ordered = buildOrderedContentItems({
    lessons: sequenceLessons,
    quizzes: sequenceQuizzes,
  });
  const lessonById = new Map(lessons.map((l) => [String(l.id), l]));
  const items: CourseItem[] = [];
  for (const item of ordered) {
    if (item.type === "lesson") {
      const l = lessonById.get(item.id);
      if (!l) continue;
      items.push({
        type: "lesson",
        id: l.id,
        slug: ((l as Record<string, unknown>).slug as string | null) ?? null,
      });
    } else {
      items.push({ type: "quiz", id: item.id });
    }
  }

  const currentIndex = items.findIndex((i) => i.type === "quiz" && i.id === quizId);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  const quizCompleted =
    isStudent && session?.user?.id
      ? (await getUserCompletedQuizIdsInCourse(session.user.id, course.id)).includes(quizId)
      : true;
  const nextBlocked = isStudent && nextItem != null && !quizCompleted;
  const isLastContentItem =
    ordered.length > 0 &&
    ordered[ordered.length - 1]?.type === "quiz" &&
    ordered[ordered.length - 1]?.id === quizId;
  const certificateHref = quizCompleted && isLastContentItem
    ? `${courseHref(course)}/certificate`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <QuizPageClient quizId={quizId} />

          <nav className="mx-auto mt-8 flex w-full max-w-3xl items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 pt-6 sm:px-6">
            {prevItem ? (
              <Link
                href={
                  prevItem.type === "lesson"
                    ? lessonHref(course, prevItem)
                    : quizHref(course, prevItem.id)
                }
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

            {certificateHref ? (
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
                    {t("courses.finishQuizFirstHint", "Submit the quiz first to continue.")}
                  </p>
                </div>
              ) : (
                <Link
                  href={
                    nextItem.type === "lesson"
                      ? lessonHref(course, nextItem)
                      : quizHref(course, nextItem.id)
                  }
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
                >
                  {nextItem.type === "lesson"
                    ? t("courses.nextLesson", "Next lesson")
                    : t("courses.nextQuiz", "Next quiz")}{" "}
                  →
                </Link>
              )
            ) : null}
          </nav>
        </article>

        <aside className="order-first lg:col-start-2 lg:row-start-1 lg:order-none">
          <CourseOutlineSidebar
            course={course}
            lessons={
              lessons as Array<
                Record<string, unknown> & {
                  id: string;
                  title?: string;
                  titleAr?: string | null;
                  order?: number;
                }
              >
            }
            quizzes={quizzes}
            currentLessonId={null}
            currentQuizId={quizId}
            unlockedLessonIds={unlockedLessonIds}
            unlockedQuizIds={unlockedQuizIds}
          />
        </aside>
      </div>
    </div>
  );
}
