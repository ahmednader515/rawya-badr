type LessonInput = {
  title: string;
  titleAr?: string;
  videoUrl?: string;
  content?: string;
  pdfUrl?: string;
  acceptsHomework?: boolean;
  homeworkImageUrl?: string;
};

type QuestionOptionInput = { text: string; isCorrect: boolean };

type QuestionInput = {
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  questionText: string;
  questionImageUrl?: string;
  options?: QuestionOptionInput[];
};

type QuizInput = {
  title: string;
  timeLimitMinutes?: number | null;
  questions: QuestionInput[];
};

export type ContentOrderEntry = { type: "lesson"; index: number } | { type: "quiz"; index: number };

export type CourseAutosaveBody = {
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  shortDescAr?: string;
  shortDescEn?: string;
  imageUrl?: string;
  price?: number;
  isPublished?: boolean;
  maxQuizAttempts?: number | null;
  categoryId?: string | null;
  categoryNameAr?: string;
  categoryNameEn?: string;
  acceptsHomework?: boolean;
  lessons?: LessonInput[];
  quizzes?: QuizInput[];
  contentOrder?: ContentOrderEntry[];
};

function questionHasBody(qt: { questionText?: string; questionImageUrl?: string }) {
  return Boolean(String(qt.questionText ?? "").trim() || String(qt.questionImageUrl ?? "").trim());
}

function lessonHasContent(l: LessonInput) {
  return Boolean(
    String(l.title ?? "").trim() ||
      String(l.videoUrl ?? "").trim() ||
      String(l.content ?? "").trim() ||
      String(l.pdfUrl ?? "").trim(),
  );
}

export function normalizeDraftCourseFields(body: CourseAutosaveBody) {
  return {
    titleAr: String(body.titleAr ?? "").trim() || "مسودة",
    titleEn: String(body.titleEn ?? "").trim() || "Draft",
    descriptionAr: String(body.descriptionAr ?? "").trim() || "-",
    descriptionEn: String(body.descriptionEn ?? "").trim() || "-",
    shortDescAr: String(body.shortDescAr ?? "").trim() || null,
    shortDescEn: String(body.shortDescEn ?? "").trim() || null,
    imageUrl: String(body.imageUrl ?? "").trim() || null,
    price: typeof body.price === "number" && Number.isFinite(body.price) ? body.price : 0,
    maxQuizAttempts:
      typeof body.maxQuizAttempts === "number" && Number.isFinite(body.maxQuizAttempts)
        ? body.maxQuizAttempts
        : null,
  };
}

export function prepareLessonsForSave(lessons: LessonInput[] | undefined, draft: boolean) {
  const list = lessons ?? [];
  if (draft) {
    return list.filter(lessonHasContent).map((l, i) => ({
      title: String(l.title ?? "").trim() || `حصة ${i + 1}`,
      titleAr: l.titleAr?.trim() || undefined,
      videoUrl: l.videoUrl?.trim() || undefined,
      content: l.content?.trim() || undefined,
      pdfUrl: l.pdfUrl?.trim() || undefined,
      acceptsHomework: false,
      homeworkImageUrl: undefined,
    }));
  }
  return list
    .filter((l) => String(l.title ?? "").trim())
    .map((l) => ({
      title: String(l.title ?? "").trim(),
      titleAr: l.titleAr?.trim() || undefined,
      videoUrl: l.videoUrl?.trim() || undefined,
      content: l.content?.trim() || undefined,
      pdfUrl: l.pdfUrl?.trim() || undefined,
      acceptsHomework: false,
      homeworkImageUrl: undefined,
    }));
}

export function prepareQuizzesForSave(quizzes: QuizInput[] | undefined, draft: boolean) {
  const list = quizzes ?? [];
  if (draft) {
    return list
      .filter((q) => String(q.title ?? "").trim() || q.questions?.some(questionHasBody))
      .map((q) => ({
        title: String(q.title ?? "").trim() || "اختبار",
        timeLimitMinutes:
          typeof q.timeLimitMinutes === "number" && Number.isFinite(q.timeLimitMinutes) && q.timeLimitMinutes >= 1
            ? q.timeLimitMinutes
            : undefined,
        questions: (q.questions ?? [])
          .filter(questionHasBody)
          .map((qt) => ({
            type: qt.type,
            questionText: String(qt.questionText ?? "").trim(),
            questionImageUrl: qt.questionImageUrl?.trim() || undefined,
            options:
              qt.type === "MULTIPLE_CHOICE"
                ? (qt.options ?? []).filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
                : qt.type === "TRUE_FALSE"
                  ? qt.options
                  : undefined,
          })),
      }));
  }
  return list
    .filter((q) => String(q.title ?? "").trim() && q.questions?.some(questionHasBody))
    .map((q) => ({
      title: String(q.title ?? "").trim(),
      timeLimitMinutes:
        typeof q.timeLimitMinutes === "number" && Number.isFinite(q.timeLimitMinutes) && q.timeLimitMinutes >= 1
          ? q.timeLimitMinutes
          : undefined,
      questions: (q.questions ?? [])
        .filter(questionHasBody)
        .map((qt) => ({
          type: qt.type,
          questionText: String(qt.questionText ?? "").trim(),
          questionImageUrl: qt.questionImageUrl?.trim() || undefined,
          options:
            qt.type === "MULTIPLE_CHOICE"
              ? (qt.options ?? []).filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
              : qt.type === "TRUE_FALSE"
                ? qt.options
                : undefined,
        })),
    }));
}

export function filterContentOrder(
  contentOrder: ContentOrderEntry[] | undefined,
  lessonCount: number,
  quizCount: number,
): ContentOrderEntry[] {
  const order =
    contentOrder ??
    ([
      ...Array.from({ length: lessonCount }, (_, i) => ({ type: "lesson" as const, index: i })),
      ...Array.from({ length: quizCount }, (_, i) => ({ type: "quiz" as const, index: i })),
    ] satisfies ContentOrderEntry[]);

  return order.filter(
    (e) =>
      (e.type === "lesson" && e.index >= 0 && e.index < lessonCount) ||
      (e.type === "quiz" && e.index >= 0 && e.index < quizCount),
  );
}

export async function saveCourseLessonsAndQuizzes(
  courseId: string,
  slug: string,
  lessons: LessonInput[],
  quizzes: QuizInput[],
  contentOrder: ContentOrderEntry[],
  deps: {
    deleteLessonsByCourseId: (id: string) => Promise<void>;
    deleteQuizzesByCourseId: (id: string) => Promise<void>;
    createLesson: (data: {
      course_id: string;
      title: string;
      title_ar?: string | null;
      slug: string;
      content?: string | null;
      video_url?: string | null;
      pdf_url?: string | null;
      order: number;
      accepts_homework?: boolean;
      homework_image_url?: string | null;
    }) => Promise<unknown>;
    createQuiz: (data: {
      course_id: string;
      title: string;
      order: number;
      time_limit_minutes?: number | null;
    }) => Promise<{ id: string }>;
    createQuestion: (data: {
      quiz_id: string;
      type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
      question_text: string;
      question_image_url?: string | null;
      order: number;
    }) => Promise<{ id: string }>;
    createQuestionOption: (data: {
      question_id: string;
      text: string;
      is_correct: boolean;
    }) => Promise<unknown>;
  },
) {
  await deps.deleteLessonsByCourseId(courseId);

  for (let i = 0; i < lessons.length; i++) {
    const le = lessons[i];
    const lessonSlug = `${slug}-${i + 1}`.replace(/\s+/g, "-");
    const order = contentOrder.findIndex((e) => e.type === "lesson" && e.index === i);
    const orderVal = order >= 0 ? order : i;
    await deps.createLesson({
      course_id: courseId,
      title: le.title?.trim() || `حصة ${i + 1}`,
      title_ar: le.titleAr?.trim() || null,
      slug: lessonSlug,
      content: le.content?.trim() || null,
      video_url: le.videoUrl?.trim() || null,
      pdf_url: le.pdfUrl?.trim() || null,
      order: orderVal,
      accepts_homework: !!le.acceptsHomework,
      homework_image_url: le.homeworkImageUrl?.trim() || null,
    });
  }

  await deps.deleteQuizzesByCourseId(courseId);

  for (let qi = 0; qi < quizzes.length; qi++) {
    const q = quizzes[qi];
    const mins = q.timeLimitMinutes;
    const timeLimitMinutes =
      typeof mins === "number" && Number.isFinite(mins) && mins >= 1 ? mins : null;
    const order = contentOrder.findIndex((e) => e.type === "quiz" && e.index === qi);
    const orderVal = order >= 0 ? order : lessons.length + qi;
    const quiz = await deps.createQuiz({
      course_id: courseId,
      title: q.title?.trim() || `اختبار ${qi + 1}`,
      order: orderVal,
      time_limit_minutes: timeLimitMinutes,
    });
    const questions = q.questions ?? [];
    for (let qti = 0; qti < questions.length; qti++) {
      const qt = questions[qti];
      const qType = qt.type === "ESSAY" ? "ESSAY" : qt.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE";
      const question = await deps.createQuestion({
        quiz_id: quiz.id,
        type: qType,
        question_text: qt.questionText?.trim() || "",
        question_image_url: qt.questionImageUrl?.trim() || null,
        order: qti + 1,
      });
      if ((qt.type === "MULTIPLE_CHOICE" || qt.type === "TRUE_FALSE") && Array.isArray(qt.options)) {
        for (const opt of qt.options) {
          await deps.createQuestionOption({
            question_id: question.id,
            text: opt.text?.trim() || "",
            is_correct: !!opt.isCorrect,
          });
        }
      }
    }
  }
}
