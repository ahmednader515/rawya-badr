import {
  getAllowedLessonIdsForUserCourse,
  getEnrollment,
  getLessonById,
  getLessonsByCourseId,
  hasFullCourseAccessAsStudent,
} from "@/lib/db";
import { getUnlockedLessonIdsForStudent } from "@/lib/lesson-sequence";

export async function canUserAccessLessonVideo(params: {
  userId?: string | null;
  role?: string | null;
  lessonId: string;
}): Promise<{ allowed: boolean; lesson: Awaited<ReturnType<typeof getLessonById>> }> {
  const { userId, role, lessonId } = params;
  const lesson = await getLessonById(lessonId);
  if (!lesson) return { allowed: false, lesson: null };

  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  if (isStaff) return { allowed: true, lesson };

  if (!userId) return { allowed: false, lesson };

  const courseId = lesson.course_id;
  const enrollment = await getEnrollment(userId, courseId);
  const isEnrolled = !!enrollment;

  let hasCourseAccess = isEnrolled;
  let allowedLessonIds: string[] = [];

  if (!hasCourseAccess && role === "STUDENT") {
    const hasFullStudentAccess = await hasFullCourseAccessAsStudent(userId, courseId);
    if (hasFullStudentAccess) {
      hasCourseAccess = true;
    } else {
      allowedLessonIds = await getAllowedLessonIdsForUserCourse(userId, courseId);
      hasCourseAccess = allowedLessonIds.includes(lessonId);
    }
  }

  if (!hasCourseAccess) return { allowed: false, lesson };

  const courseLessons = await getLessonsByCourseId(courseId);
  const partialOnly = !isEnrolled && allowedLessonIds.length > 0;
  const unlocked = await getUnlockedLessonIdsForStudent({
    userId,
    role,
    courseLessons,
    courseId,
    allowedLessonIds: partialOnly ? allowedLessonIds : null,
  });

  if (!unlocked.has(lessonId)) return { allowed: false, lesson };

  return { allowed: true, lesson };
}
