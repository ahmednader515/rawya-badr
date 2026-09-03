import { getUserCompletedLessonIdsInCourse } from "@/lib/db";

export type SequenceLesson = {
  id: string;
  order?: number | null;
};

export function sortLessonsByOrder(lessons: SequenceLesson[]): SequenceLesson[] {
  return [...lessons].sort((a, b) => {
    const ao = typeof a.order === "number" ? a.order : 999;
    const bo = typeof b.order === "number" ? b.order : 999;
    return ao - bo;
  });
}

function filterLessonsForAccess(
  lessons: SequenceLesson[],
  allowedLessonIds?: string[] | null,
): SequenceLesson[] {
  if (!allowedLessonIds || allowedLessonIds.length === 0) return lessons;
  const allowed = new Set(allowedLessonIds);
  return lessons.filter((l) => allowed.has(l.id));
}

/** First lesson is open; each next lesson requires all prior lessons to be rated. */
export async function getUnlockedLessonIdsForStudent(params: {
  userId: string;
  role: string | null | undefined;
  courseLessons: SequenceLesson[];
  courseId: string;
  allowedLessonIds?: string[] | null;
}): Promise<Set<string>> {
  const { userId, role, courseLessons, courseId, allowedLessonIds } = params;
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  const ordered = sortLessonsByOrder(filterLessonsForAccess(courseLessons, allowedLessonIds));
  if (isStaff) return new Set(ordered.map((l) => l.id));

  const completedSet = new Set(await getUserCompletedLessonIdsInCourse(userId, courseId));
  const unlocked = new Set<string>();

  for (let i = 0; i < ordered.length; i++) {
    if (i === 0) {
      unlocked.add(ordered[i].id);
      continue;
    }
    const allPriorCompleted = ordered.slice(0, i).every((l) => completedSet.has(l.id));
    if (allPriorCompleted) unlocked.add(ordered[i].id);
    else break;
  }

  return unlocked;
}

export async function isLessonSequentiallyUnlocked(params: {
  userId: string;
  role: string | null | undefined;
  lessonId: string;
  courseLessons: SequenceLesson[];
  courseId: string;
  allowedLessonIds?: string[] | null;
}): Promise<{ unlocked: boolean; blockedByLessonId: string | null }> {
  const unlockedSet = await getUnlockedLessonIdsForStudent(params);
  if (unlockedSet.has(params.lessonId)) {
    return { unlocked: true, blockedByLessonId: null };
  }

  const ordered = sortLessonsByOrder(
    filterLessonsForAccess(params.courseLessons, params.allowedLessonIds),
  );
  const idx = ordered.findIndex((l) => l.id === params.lessonId);
  if (idx <= 0) return { unlocked: false, blockedByLessonId: null };

  const completedSet = new Set(
    await getUserCompletedLessonIdsInCourse(params.userId, params.courseId),
  );
  for (let i = 0; i < idx; i++) {
    if (!completedSet.has(ordered[i].id)) {
      return { unlocked: false, blockedByLessonId: ordered[i].id };
    }
  }
  return { unlocked: false, blockedByLessonId: ordered[idx - 1]?.id ?? null };
}
