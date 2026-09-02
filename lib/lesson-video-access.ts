import {
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  getLessonById,
  hasFullCourseAccessAsStudent,
} from "@/lib/db";

export async function canUserAccessLessonVideo(params: {
  userId?: string | null;
  role?: string | null;
  lessonId: string;
}): Promise<{ allowed: boolean; lesson: Awaited<ReturnType<typeof getLessonById>> }> {
  const { userId, role, lessonId } = params;
  const lesson = await getLessonById(lessonId);
  if (!lesson) return { allowed: false, lesson: null };

  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN";
  if (isStaff) return { allowed: true, lesson };

  if (!userId) return { allowed: false, lesson };

  const courseId = lesson.course_id;
  const enrollment = await getEnrollment(userId, courseId);
  const isEnrolled = !!enrollment;

  if (isEnrolled) return { allowed: true, lesson };

  if (role === "STUDENT") {
    const hasFullStudentAccess = await hasFullCourseAccessAsStudent(userId, courseId);
    if (hasFullStudentAccess) return { allowed: true, lesson };

    const allowedLessonIds = await getAllowedLessonIdsForUserCourse(userId, courseId);
    if (allowedLessonIds.includes(lessonId)) return { allowed: true, lesson };
  }

  return { allowed: false, lesson };
}
