import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAllowedLessonIdsForUserCourse,
  getEnrollment,
  getLessonById,
  hasFullCourseAccessAsStudent,
  isLessonWatchComplete,
  markLessonWatchComplete,
} from "@/lib/db";
import { getUnlockedLessonIdsForStudent } from "@/lib/lesson-sequence";

async function canAccessLesson(userId: string, role: string, lessonId: string, courseId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER") return true;
  if (await getEnrollment(userId, courseId)) return true;
  if (role === "STUDENT") {
    if (await hasFullCourseAccessAsStudent(userId, courseId)) return true;
    const partial = await getAllowedLessonIdsForUserCourse(userId, courseId);
    if (partial.includes(lessonId)) return true;
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { lessonId } = await params;
    const lesson = await getLessonById(lessonId);
    if (!lesson) return NextResponse.json({ error: "الحصة غير موجودة" }, { status: 404 });

    const allowed = await canAccessLesson(session.user.id, session.user.role, lesson.id, lesson.course_id);
    if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const completed = await isLessonWatchComplete(session.user.id, lesson.id);
    return NextResponse.json({ completed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر التحقق من إكمال الحصة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { lessonId } = await params;
    const lesson = await getLessonById(lessonId);
    if (!lesson) return NextResponse.json({ error: "الحصة غير موجودة" }, { status: 404 });

    const allowed = await canAccessLesson(session.user.id, session.user.role, lesson.id, lesson.course_id);
    if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const partial = await getAllowedLessonIdsForUserCourse(session.user.id, lesson.course_id);
    const enrollment = await getEnrollment(session.user.id, lesson.course_id);
    const partialOnly = !enrollment && partial.length > 0;
    const { getLessonsByCourseId } = await import("@/lib/db");
    const courseLessons = await getLessonsByCourseId(lesson.course_id);
    const unlocked = await getUnlockedLessonIdsForStudent({
      userId: session.user.id,
      role: session.user.role,
      courseLessons,
      courseId: lesson.course_id,
      allowedLessonIds: partialOnly ? partial : null,
    });
    if (!unlocked.has(lesson.id)) {
      return NextResponse.json({ error: "يجب إكمال الحصة السابقة أولاً" }, { status: 403 });
    }

    await markLessonWatchComplete({
      user_id: session.user.id,
      lesson_id: lesson.id,
      course_id: lesson.course_id,
    });

    return NextResponse.json({ success: true, completed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر حفظ إكمال الحصة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
