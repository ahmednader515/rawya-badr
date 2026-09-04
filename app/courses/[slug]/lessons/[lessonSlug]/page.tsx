import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  hasFullCourseAccessAsStudent,
  isLessonWatchComplete,
} from "@/lib/db";
import { LessonWatchShell } from "@/components/LessonWatchShell";
import { normalizeVdoCipherVideoId } from "@/lib/vdocipher-video-id";
import { CourseOutlineSidebar } from "@/components/CourseOutlineSidebar";
import { LessonNavigationBar } from "@/components/LessonNavigationBar";
import { LessonStudentFlow } from "@/components/LessonStudentFlow";
import { getUnlockedContentForStudent, buildOrderedContentItems } from "@/lib/lesson-sequence";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

type Props = { params: Promise<{ slug: string; lessonSlug: string }> };

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function isLessonId(segment: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(segment);
}

function courseHref(course: { slug?: string | null; id: string }): string {
  const segment = (course.slug && course.slug.trim()) ? encodeURIComponent(course.slug.trim()) : course.id;
  return `/courses/${segment}`;
}

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = (course.slug && course.slug.trim()) ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : (course as { id: string }).id;
}

function lessonHref(course: { slug?: string | null; id: string }, lesson: { slug?: string | null; id: string }): string {
  const seg = courseSeg(course);
  const lessonSeg = (lesson.slug && lesson.slug.trim()) ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  return `/courses/${courseSeg(course)}/quizzes/${encodeURIComponent(quizId)}`;
}

type CourseItem =
  | { type: "lesson"; id: string; slug?: string | null; title: string; titleAr?: string | null }
  | { type: "quiz"; id: string; title: string; _count?: { questions?: number } };

export default async function LessonPage({ params }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { slug: courseSegment, lessonSlug: lessonSegment } = await params;
  const courseDecoded = decodeSegment(courseSegment);
  const lessonDecoded = decodeSegment(lessonSegment);
  const session = await getServerSession(authOptions);

  const data = await getCourseWithContent(courseDecoded);
  if (!data?.course) notFound();

  const course = data.course as unknown as Record<string, unknown> & { id: string; lessons: Record<string, unknown>[]; quizzes?: Array<Record<string, unknown> & { _count?: { questions?: number } }> };
  course.lessons = data.lessons;
  course.quizzes = data.quizzes ?? [];

  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const isStudent = session?.user?.role === "STUDENT";
  let isEnrolled = false;
  let allowedLessonIds: string[] = [];
  let hasFullStudentAccess = false;
  if (session?.user?.id) {
    const en = await getEnrollment(session.user.id, course.id);
    isEnrolled = !!en;
    if (session.user.role === "STUDENT") {
      hasFullStudentAccess = await hasFullCourseAccessAsStudent(session.user.id, course.id);
    }
    if (!isEnrolled && !isStaff && !hasFullStudentAccess) {
      allowedLessonIds = await getAllowedLessonIdsForUserCourse(session.user.id, course.id);
    }
  }
  const canAccessCourse =
    isStaff || isEnrolled || hasFullStudentAccess || allowedLessonIds.length > 0;
  if (!canAccessCourse) notFound();

  const lesson = isLessonId(lessonDecoded)
    ? data.lessons.find((l: Record<string, unknown>) => l.id === lessonDecoded)
    : data.lessons.find((l: Record<string, unknown>) => l.slug === lessonDecoded);
  if (!lesson) notFound();

  // لو الوصول جزئي فقط (بدون تسجيل كامل أو اشتراك منصة): لا نسمح بفتح إلا الحصص المحددة
  if (!isStaff && !isEnrolled && !hasFullStudentAccess && allowedLessonIds.length > 0) {
    const lid = String((lesson as Record<string, unknown>).id ?? "");
    if (!allowedLessonIds.includes(lid)) notFound();
  }

  const lessonObj = lesson as Record<string, unknown>;
  const lessonIdStr = String(lessonObj.id ?? "");

  const lessonsAll = (course.lessons ?? []) as Array<
    Record<string, unknown> & { id: string; title?: string; titleAr?: string | null; order?: number }
  >;

  const partialOnly = !isStaff && !isEnrolled && !hasFullStudentAccess && allowedLessonIds.length > 0;
  const quizzesAll = (course.quizzes ?? []) as Array<
    Record<string, unknown> & {
      id: string;
      title?: string;
      order?: number;
      _count?: { questions?: number };
    }
  >;
  const sequenceLessons = lessonsAll.map((l) => ({
    id: String(l.id),
    order: typeof l.order === "number" ? l.order : null,
  }));
  const sequenceQuizzes = quizzesAll.map((q) => ({
    id: String(q.id),
    order: typeof q.order === "number" ? q.order : null,
  }));

  let unlockedLessonIds: string[] = lessonsAll.map((l) => String(l.id));
  let unlockedQuizIds: string[] = quizzesAll.map((q) => String(q.id));
  if (isStudent && session?.user?.id) {
    const unlocked = await getUnlockedContentForStudent({
      userId: session.user.id,
      role: session.user.role,
      courseLessons: sequenceLessons,
      courseQuizzes: sequenceQuizzes,
      courseId: course.id,
      allowedLessonIds: partialOnly ? allowedLessonIds : null,
    });
    unlockedLessonIds = [...unlocked.unlockedLessonIds];
    unlockedQuizIds = [...unlocked.unlockedQuizIds];
  }

  if (isStudent && session?.user?.id && !unlockedLessonIds.includes(lessonIdStr)) {
    notFound();
  }

  const watchComplete =
    isStudent && session?.user?.id
      ? await isLessonWatchComplete(session.user.id, lessonIdStr)
      : true;

  const orderedContent = buildOrderedContentItems({
    lessons: sequenceLessons,
    quizzes: sequenceQuizzes,
  });
  const isLastContentItem =
    orderedContent.length > 0 &&
    orderedContent[orderedContent.length - 1]?.type === "lesson" &&
    orderedContent[orderedContent.length - 1]?.id === lessonIdStr;

  const certificateHref = `/courses/${courseSeg(course)}/certificate`;
  const videoUrl = (lessonObj.videoUrl ?? lessonObj.video_url) as string;
  const vdocipherVideoId = normalizeVdoCipherVideoId(videoUrl);
  const courseAr =
    course.titleAr != null
      ? String(course.titleAr)
      : course.title_ar != null
        ? String(course.title_ar)
        : null;
  const courseEn = course.title != null ? String(course.title) : null;
  const courseTitle = pickLocalizedText(locale, courseAr, courseEn) || courseEn || courseAr || "";
  const lessonAr =
    lessonObj.titleAr != null
      ? String(lessonObj.titleAr)
      : lessonObj.title_ar != null
        ? String(lessonObj.title_ar)
        : null;
  const lessonEn = lessonObj.title != null ? String(lessonObj.title) : null;
  const lessonTitle = pickLocalizedText(locale, lessonAr, lessonEn) || lessonEn || lessonAr || "";

  const lessons =
    !isStaff && !isEnrolled && !hasFullStudentAccess && allowedLessonIds.length > 0
      ? lessonsAll.filter((l) => allowedLessonIds.includes(String(l.id)))
      : lessonsAll;
  const quizzes =
    !isStaff && !isEnrolled && !hasFullStudentAccess && allowedLessonIds.length > 0
      ? []
      : quizzesAll;

  const lessonById = new Map(lessons.map((l) => [String(l.id), l]));
  const quizById = new Map(quizzes.map((q) => [String(q.id), q]));
  const items: CourseItem[] = [];
  for (const item of orderedContent) {
    if (item.type === "lesson") {
      const l = lessonById.get(item.id);
      if (!l) continue;
      items.push({
        type: "lesson",
        id: l.id,
        slug: ((l as Record<string, unknown>).slug as string | null) ?? null,
        title: String(l.title ?? ""),
        titleAr: l.titleAr,
      });
    } else {
      const q = quizById.get(item.id);
      if (!q) continue;
      items.push({
        type: "quiz",
        id: q.id,
        title: String(q.title ?? ""),
        _count: q._count,
      });
    }
  }

  const currentIndex = items.findIndex((i) => i.type === "lesson" && i.id === lessonObj.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link href={courseHref(course)} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          ← {t("courses.backToCourse", "Back to")} {courseTitle}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        {/* محتوى الحصة — دائماً العمود العريض */}
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{lessonTitle}</h1>

          {isStudent ? (
            <LessonStudentFlow
              lessonId={lessonIdStr}
              videoId={vdocipherVideoId}
              initialWatchComplete={watchComplete}
              isLastLesson={isLastContentItem}
              certificateHref={certificateHref}
              prevItem={prevItem}
              nextItem={nextItem}
              prevHref={
                prevItem
                  ? prevItem.type === "lesson"
                    ? lessonHref(course, { id: prevItem.id, slug: prevItem.slug ?? undefined })
                    : quizHref(course, prevItem.id)
                  : null
              }
              nextHref={
                nextItem
                  ? nextItem.type === "lesson"
                    ? lessonHref(course, { id: nextItem.id, slug: nextItem.slug ?? undefined })
                    : quizHref(course, nextItem.id)
                  : null
              }
            >
              {(lessonObj.pdfUrl ?? lessonObj.pdf_url) ? (
                <div className="mt-6">
                  <a
                    href={String(lessonObj.pdfUrl ?? lessonObj.pdf_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    📄 {t("courses.downloadPdf", "Download / View PDF")}
                  </a>
                </div>
              ) : null}

              {lessonObj.content ? (
                <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 prose-custom text-[var(--color-foreground)]">
                  {String(lessonObj.content).split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}
            </LessonStudentFlow>
          ) : (
            <>
              {vdocipherVideoId ? (
                <LessonWatchShell lessonId={lessonIdStr} videoId={vdocipherVideoId} />
              ) : null}

              {(lessonObj.pdfUrl ?? lessonObj.pdf_url) ? (
                <div className="mt-6">
                  <a
                    href={String(lessonObj.pdfUrl ?? lessonObj.pdf_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    📄 {t("courses.downloadPdf", "Download / View PDF")}
                  </a>
                </div>
              ) : null}

              {lessonObj.content ? (
                <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 prose-custom text-[var(--color-foreground)]">
                  {String(lessonObj.content).split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}

              <LessonNavigationBar
                prevItem={prevItem}
                nextItem={nextItem}
                prevHref={
                  prevItem
                    ? prevItem.type === "lesson"
                      ? lessonHref(course, { id: prevItem.id, slug: prevItem.slug ?? undefined })
                      : quizHref(course, prevItem.id)
                    : null
                }
                nextHref={
                  nextItem
                    ? nextItem.type === "lesson"
                      ? lessonHref(course, { id: nextItem.id, slug: nextItem.slug ?? undefined })
                      : quizHref(course, nextItem.id)
                    : null
                }
                watchComplete
                isStudent={false}
              />
            </>
          )}
        </article>

        <aside className="order-first lg:col-start-2 lg:row-start-1 lg:order-none">
          <CourseOutlineSidebar
            course={course}
            lessons={lessons}
            quizzes={quizzes}
            currentLessonId={lessonObj.id as string}
            currentQuizId={null}
            unlockedLessonIds={isStudent ? unlockedLessonIds : null}
            unlockedQuizIds={isStudent ? unlockedQuizIds : null}
          />
        </aside>
      </div>
    </div>
  );
}
