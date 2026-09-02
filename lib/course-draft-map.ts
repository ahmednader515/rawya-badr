import type { ContentOrderEntry } from "@/lib/course-content-save";

export type DraftLessonRow = {
  title: string;
  videoUrl: string;
  content: string;
  pdfUrl: string;
};

export type DraftQuizRow = {
  title: string;
  timeLimitMinutes: string;
  questions: Array<{
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    questionText: string;
    questionImageUrl: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

export function contentOrderFromDraftRows(
  lessonRows: Record<string, unknown>[],
  quizRows: Record<string, unknown>[],
): ContentOrderEntry[] {
  type Sortable = ContentOrderEntry & { sortKey: number };
  const entries: Sortable[] = [];
  for (let i = 0; i < lessonRows.length; i++) {
    const row = lessonRows[i];
    const o = row.order;
    const sortKey = typeof o === "number" && Number.isFinite(o) ? o : i;
    entries.push({ type: "lesson", index: i, sortKey });
  }
  for (let i = 0; i < quizRows.length; i++) {
    const row = quizRows[i];
    const o = row.order;
    const sortKey = typeof o === "number" && Number.isFinite(o) ? o : lessonRows.length + i;
    entries.push({ type: "quiz", index: i, sortKey });
  }
  entries.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    if (a.type !== b.type) return a.type === "lesson" ? -1 : 1;
    return a.index - b.index;
  });
  return entries.map(({ type, index }) => ({ type, index }));
}

export function mapDraftToFormState(draft: {
  course: Record<string, unknown>;
  lessons: Record<string, unknown>[];
  quizzes: Array<Record<string, unknown> & { questions?: Array<Record<string, unknown> & { options?: Record<string, unknown>[] }> }>;
}) {
  const c = draft.course;
  const lessons: DraftLessonRow[] =
    draft.lessons.length > 0
      ? draft.lessons.map((l) => ({
          title: String(l.title ?? ""),
          videoUrl: String(l.videoUrl ?? l.video_url ?? ""),
          content: String(l.content ?? ""),
          pdfUrl: String(l.pdfUrl ?? l.pdf_url ?? ""),
        }))
      : [
          {
            title: "",
            videoUrl: "",
            content: "",
            pdfUrl: "",
          },
        ];

  const quizzes: DraftQuizRow[] =
    draft.quizzes.length > 0
      ? draft.quizzes.map((q) => {
          const rawLimit = q.timeLimitMinutes ?? q.time_limit_minutes;
          const timeLimitMinutes =
            typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit >= 1
              ? String(rawLimit)
              : "";
          const questions = (q.questions ?? []).map((qt) => ({
            type: (qt.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE") as "MULTIPLE_CHOICE" | "TRUE_FALSE",
            questionText: String(qt.questionText ?? qt.question_text ?? ""),
            questionImageUrl: String(qt.questionImageUrl ?? qt.question_image_url ?? ""),
            options: ((qt.options ?? []) as Record<string, unknown>[]).map((o) => ({
              text: String(o.text ?? ""),
              isCorrect: Boolean(o.isCorrect ?? o.is_correct ?? false),
            })),
          }));
          return {
            title: String(q.title ?? ""),
            timeLimitMinutes,
            questions: questions.length > 0 ? questions : [{ type: "MULTIPLE_CHOICE" as const, questionText: "", questionImageUrl: "", options: [{ text: "", isCorrect: false }] }],
          };
        })
      : [
          {
            title: "",
            timeLimitMinutes: "",
            questions: [{ type: "MULTIPLE_CHOICE" as const, questionText: "", questionImageUrl: "", options: [{ text: "", isCorrect: false }] }],
          },
        ];

  const contentOrder = contentOrderFromDraftRows(draft.lessons, draft.quizzes);

  return {
    draftId: String(c.id ?? ""),
    form: {
      titleAr: String(c.titleAr ?? c.title_ar ?? ""),
      titleEn: String(c.titleEn ?? c.title ?? ""),
      descriptionAr: String(c.description ?? ""),
      descriptionEn: String(c.descriptionEn ?? c.description_en ?? ""),
      shortDescAr: String(c.shortDesc ?? c.short_desc ?? ""),
      shortDescEn: String(c.shortDescEn ?? c.short_desc_en ?? ""),
      imageUrl: String(c.imageUrl ?? c.image_url ?? ""),
      price: String(Number(c.price ?? 0)),
      maxQuizAttempts:
        typeof c.maxQuizAttempts === "number"
          ? String(c.maxQuizAttempts)
          : typeof c.max_quiz_attempts === "number"
            ? String(c.max_quiz_attempts)
            : "",
      categoryId: String(c.categoryId ?? c.category_id ?? ""),
      categoryNameAr: "",
      categoryNameEn: "",
    },
    lessons,
    quizzes,
    contentOrder:
      contentOrder.length > 0
        ? contentOrder
        : ([
            { type: "lesson" as const, index: 0 },
            { type: "quiz" as const, index: 0 },
          ] satisfies ContentOrderEntry[]),
  };
}
