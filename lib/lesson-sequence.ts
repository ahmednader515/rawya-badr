import {
  getUserCompletedLessonIdsInCourse,
  getUserCompletedQuizIdsInCourse,
} from "@/lib/db";

export type SequenceLesson = {
  id: string;
  order?: number | null;
};

export type SequenceQuiz = {
  id: string;
  order?: number | null;
};

export type SequenceContentItem =
  | { type: "lesson"; id: string; order: number }
  | { type: "quiz"; id: string; order: number };

function orderValue(order?: number | null): number {
  return typeof order === "number" && Number.isFinite(order) ? order : 999;
}

/** Build one ordered list of lessons + quizzes (by shared `order` field). */
export function buildOrderedContentItems(params: {
  lessons: SequenceLesson[];
  quizzes?: SequenceQuiz[];
}): SequenceContentItem[] {
  const lessons = params.lessons.map((l) => ({
    type: "lesson" as const,
    id: l.id,
    order: orderValue(l.order),
  }));
  const quizzes = (params.quizzes ?? []).map((q) => ({
    type: "quiz" as const,
    id: q.id,
    order: orderValue(q.order),
  }));
  return [...lessons, ...quizzes].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    // Stable tie-break: lessons before quizzes at same order index
    if (a.type !== b.type) return a.type === "lesson" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

export function sortLessonsByOrder(lessons: SequenceLesson[]): SequenceLesson[] {
  return [...lessons].sort((a, b) => orderValue(a.order) - orderValue(b.order));
}

function filterItemsForAccess(
  items: SequenceContentItem[],
  allowedLessonIds?: string[] | null,
  allowedQuizIds?: string[] | null,
): SequenceContentItem[] {
  const hasLessonFilter = !!allowedLessonIds && allowedLessonIds.length > 0;
  const hasQuizFilter = !!allowedQuizIds && allowedQuizIds.length > 0;
  if (!hasLessonFilter && !hasQuizFilter) return items;

  const allowedLessons = new Set(allowedLessonIds ?? []);
  const allowedQuizzes = new Set(allowedQuizIds ?? []);
  return items.filter((item) => {
    if (item.type === "lesson") {
      return !hasLessonFilter || allowedLessons.has(item.id);
    }
    return !hasQuizFilter || allowedQuizzes.has(item.id);
  });
}

function itemKey(item: SequenceContentItem): string {
  return `${item.type}:${item.id}`;
}

export type UnlockedContent = {
  unlockedLessonIds: Set<string>;
  unlockedQuizIds: Set<string>;
};

/**
 * First content item is open; each next item requires all prior items completed
 * (lessons = watch-complete, quizzes = submitted attempt).
 */
export async function getUnlockedContentForStudent(params: {
  userId: string;
  role: string | null | undefined;
  courseLessons: SequenceLesson[];
  courseQuizzes?: SequenceQuiz[];
  courseId: string;
  allowedLessonIds?: string[] | null;
  allowedQuizIds?: string[] | null;
}): Promise<UnlockedContent> {
  const {
    userId,
    role,
    courseLessons,
    courseQuizzes,
    courseId,
    allowedLessonIds,
    allowedQuizIds,
  } = params;
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  const ordered = filterItemsForAccess(
    buildOrderedContentItems({ lessons: courseLessons, quizzes: courseQuizzes }),
    allowedLessonIds,
    allowedQuizIds,
  );

  const unlockedLessonIds = new Set<string>();
  const unlockedQuizIds = new Set<string>();

  if (isStaff) {
    for (const item of ordered) {
      if (item.type === "lesson") unlockedLessonIds.add(item.id);
      else unlockedQuizIds.add(item.id);
    }
    return { unlockedLessonIds, unlockedQuizIds };
  }

  const [completedLessons, completedQuizzes] = await Promise.all([
    getUserCompletedLessonIdsInCourse(userId, courseId),
    getUserCompletedQuizIdsInCourse(userId, courseId),
  ]);
  const completedKeys = new Set<string>([
    ...completedLessons.map((id) => `lesson:${id}`),
    ...completedQuizzes.map((id) => `quiz:${id}`),
  ]);

  for (let i = 0; i < ordered.length; i++) {
    if (i === 0) {
      if (ordered[i].type === "lesson") unlockedLessonIds.add(ordered[i].id);
      else unlockedQuizIds.add(ordered[i].id);
      continue;
    }
    const allPriorCompleted = ordered
      .slice(0, i)
      .every((item) => completedKeys.has(itemKey(item)));
    if (!allPriorCompleted) break;
    if (ordered[i].type === "lesson") unlockedLessonIds.add(ordered[i].id);
    else unlockedQuizIds.add(ordered[i].id);
  }

  return { unlockedLessonIds, unlockedQuizIds };
}

/** @deprecated Prefer getUnlockedContentForStudent — kept for lesson-only callers. */
export async function getUnlockedLessonIdsForStudent(params: {
  userId: string;
  role: string | null | undefined;
  courseLessons: SequenceLesson[];
  courseQuizzes?: SequenceQuiz[];
  courseId: string;
  allowedLessonIds?: string[] | null;
  allowedQuizIds?: string[] | null;
}): Promise<Set<string>> {
  const { unlockedLessonIds } = await getUnlockedContentForStudent(params);
  return unlockedLessonIds;
}

export async function isContentItemSequentiallyUnlocked(params: {
  userId: string;
  role: string | null | undefined;
  itemType: "lesson" | "quiz";
  itemId: string;
  courseLessons: SequenceLesson[];
  courseQuizzes?: SequenceQuiz[];
  courseId: string;
  allowedLessonIds?: string[] | null;
  allowedQuizIds?: string[] | null;
}): Promise<{ unlocked: boolean; blockedBy: SequenceContentItem | null }> {
  const unlocked = await getUnlockedContentForStudent(params);
  const isUnlocked =
    params.itemType === "lesson"
      ? unlocked.unlockedLessonIds.has(params.itemId)
      : unlocked.unlockedQuizIds.has(params.itemId);
  if (isUnlocked) return { unlocked: true, blockedBy: null };

  const ordered = filterItemsForAccess(
    buildOrderedContentItems({
      lessons: params.courseLessons,
      quizzes: params.courseQuizzes,
    }),
    params.allowedLessonIds,
    params.allowedQuizIds,
  );
  const idx = ordered.findIndex(
    (item) => item.type === params.itemType && item.id === params.itemId,
  );
  if (idx <= 0) return { unlocked: false, blockedBy: null };

  const [completedLessons, completedQuizzes] = await Promise.all([
    getUserCompletedLessonIdsInCourse(params.userId, params.courseId),
    getUserCompletedQuizIdsInCourse(params.userId, params.courseId),
  ]);
  const completedKeys = new Set<string>([
    ...completedLessons.map((id) => `lesson:${id}`),
    ...completedQuizzes.map((id) => `quiz:${id}`),
  ]);
  for (let i = 0; i < idx; i++) {
    if (!completedKeys.has(itemKey(ordered[i]))) {
      return { unlocked: false, blockedBy: ordered[i] };
    }
  }
  return { unlocked: false, blockedBy: ordered[idx - 1] ?? null };
}

export async function isLessonSequentiallyUnlocked(params: {
  userId: string;
  role: string | null | undefined;
  lessonId: string;
  courseLessons: SequenceLesson[];
  courseQuizzes?: SequenceQuiz[];
  courseId: string;
  allowedLessonIds?: string[] | null;
  allowedQuizIds?: string[] | null;
}): Promise<{ unlocked: boolean; blockedByLessonId: string | null }> {
  const result = await isContentItemSequentiallyUnlocked({
    ...params,
    itemType: "lesson",
    itemId: params.lessonId,
  });
  return {
    unlocked: result.unlocked,
    blockedByLessonId:
      result.blockedBy?.type === "lesson" ? result.blockedBy.id : null,
  };
}
