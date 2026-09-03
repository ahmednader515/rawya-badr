import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  isCourseCompletedByUser,
  getCourseRatingForUser,
  getCourseRatingRequired,
  getCourseCertificateForUser,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseRatingForm } from "./CourseRatingForm";

type Props = { params: Promise<{ slug: string }> };

function decodeSlug(s: string) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function courseHref(course: { slug?: string | null; id: string }) {
  const seg = course.slug?.trim() ? encodeURIComponent(course.slug.trim()) : course.id;
  return `/courses/${seg}`;
}

function certificateHref(course: { slug?: string | null; id: string }) {
  return `${courseHref(course)}/certificate`;
}

export default async function CourseRatePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const t = await getServerTranslator();
  const { slug: segment } = await params;
  const data = await getCourseWithContent(decodeSlug(segment));
  if (!data?.course) notFound();

  const course = data.course;
  const userId = session.user.id;
  const role = session.user.role;

  // Check access
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN";
  if (isStaff) redirect(courseHref(course));

  const isEnrolled = !!(await getEnrollment(userId, course.id));
  const hasFullAccess = await hasFullCourseAccessAsStudent(userId, course.id);
  if (!isEnrolled && !hasFullAccess) notFound();

  // Must have completed the course
  const completed = await isCourseCompletedByUser(userId, course.id);
  if (!completed) redirect(courseHref(course));

  // If rating is not required AND no existing rating → redirect straight to certificate
  const ratingRequired = await getCourseRatingRequired(course.id);
  const existingRating = await getCourseRatingForUser(userId, course.id);

  if (!ratingRequired && !existingRating) {
    // Auto-issue certificate then redirect
    const { issueCourseCertificateIfEligible } = await import("@/lib/db");
    await issueCourseCertificateIfEligible(userId, course.id);
    redirect(certificateHref(course));
  }

  // If already has a certificate and has rated → just redirect
  const cert = await getCourseCertificateForUser(userId, course.id);
  if (cert && existingRating) redirect(certificateHref(course));

  const courseTitle =
    (course as { titleAr?: string | null; title_ar?: string | null }).titleAr ??
    (course as { title_ar?: string | null }).title_ar ??
    (course as { title?: string | null }).title ??
    "";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href={courseHref(course)}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← {t("courses.backToCourse", "Back to course")}
        </Link>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="text-5xl">🎉</span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-foreground)]">
            {t("courses.courseCompletedHeading", "You finished the course!")}
          </h1>
          {courseTitle ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{String(courseTitle)}</p>
          ) : null}
          <p className="mt-3 text-sm text-[var(--color-foreground)]">
            {ratingRequired
              ? t(
                  "courses.courseRatingRequiredPrompt",
                  "Please rate the course to receive your certificate.",
                )
              : t(
                  "courses.courseRatingOptionalPrompt",
                  "Would you like to rate the course before getting your certificate?",
                )}
          </p>
        </div>

        <CourseRatingForm
          courseSlug={segment}
          certificateHref={certificateHref(course)}
          existingStars={existingRating?.stars ?? null}
          existingComment={existingRating?.comment ?? null}
        />

        {!ratingRequired && (
          <div className="mt-4 text-center">
            <Link
              href={certificateHref(course)}
              className="text-sm text-[var(--color-muted)] underline hover:text-[var(--color-foreground)]"
            >
              {t("courses.skipRating", "Skip and get certificate")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
