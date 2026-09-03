import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  isCourseCompletedByUser,
  getCourseRatingForUser,
  upsertCourseRating,
  getCourseRatingSummary,
  getCourseCertificateForUser,
  issueCourseCertificateIfEligible,
  getCourseRatingRequired,
} from "@/lib/db";

async function resolveCourse(slug: string) {
  const data = await getCourseWithContent(slug);
  return data?.course ?? null;
}

async function canAccessCourse(
  userId: string,
  role: string,
  courseId: string,
): Promise<boolean> {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (await getEnrollment(userId, courseId)) return true;
  if (role === "STUDENT" && (await hasFullCourseAccessAsStudent(userId, courseId))) return true;
  return false;
}

/** GET /api/courses/[slug]/rating — fetch the user's rating + summary */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const { slug } = await params;
    const course = await resolveCourse(decodeURIComponent(slug));
    if (!course) return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });

    const allowed = await canAccessCourse(session.user.id, session.user.role, course.id);
    if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const [userRating, summary] = await Promise.all([
      getCourseRatingForUser(session.user.id, course.id),
      getCourseRatingSummary(course.id),
    ]);

    return NextResponse.json({
      userRating: userRating
        ? { stars: userRating.stars, comment: userRating.comment }
        : null,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر تحميل التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/courses/[slug]/rating — submit or update a course rating */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { slug } = await params;
    const course = await resolveCourse(decodeURIComponent(slug));
    if (!course) return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });

    const allowed = await canAccessCourse(session.user.id, session.user.role, course.id);
    if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    // Must have completed the course
    const completed = await isCourseCompletedByUser(session.user.id, course.id);
    if (!completed) {
      return NextResponse.json(
        { error: "يجب إكمال جميع دروس الدورة أولاً قبل التقييم" },
        { status: 403 },
      );
    }

    let body: { stars?: unknown; comment?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const stars = Number(body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "التقييم يجب أن يكون من 1 إلى 5 نجوم" }, { status: 400 });
    }

    const comment =
      body.comment != null ? String(body.comment).trim().slice(0, 2000) || null : null;

    await upsertCourseRating({
      course_id: course.id,
      user_id: session.user.id,
      stars,
      comment,
    });

    // Issue certificate if not yet issued
    const certificate = await issueCourseCertificateIfEligible(session.user.id, course.id);

    const [userRating, summary] = await Promise.all([
      getCourseRatingForUser(session.user.id, course.id),
      getCourseRatingSummary(course.id),
    ]);

    return NextResponse.json({
      success: true,
      certificateIssued: !!certificate,
      userRating: userRating
        ? { stars: userRating.stars, comment: userRating.comment }
        : null,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر حفظ التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

