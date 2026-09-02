import type { CourseAutosaveBody } from "@/lib/course-content-save";

export type CourseFormCoreState = {
  form: {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    shortDescAr: string;
    shortDescEn: string;
    imageUrl: string;
    price: string;
    maxQuizAttempts: string;
    categoryId: string;
    categoryNameAr: string;
    categoryNameEn: string;
  };
  lessons: Array<{
    title: string;
    videoUrl: string;
    content: string;
    pdfUrl: string;
    acceptsHomework: boolean;
    homeworkImageUrl: string;
  }>;
  quizzes: Array<{
    title: string;
    timeLimitMinutes: string;
    questions: Array<{
      type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
      questionText: string;
      questionImageUrl: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }>;
  contentOrder: Array<{ type: "lesson"; index: number } | { type: "quiz"; index: number }>;
  isPublished?: boolean;
};

export function buildCourseAutosavePayload(state: CourseFormCoreState): CourseAutosaveBody {
  return {
    titleAr: state.form.titleAr,
    titleEn: state.form.titleEn,
    descriptionAr: state.form.descriptionAr,
    descriptionEn: state.form.descriptionEn,
    shortDescAr: state.form.shortDescAr || undefined,
    shortDescEn: state.form.shortDescEn || undefined,
    imageUrl: state.form.imageUrl || undefined,
    price: state.form.price ? parseFloat(state.form.price) : 0,
    maxQuizAttempts: state.form.maxQuizAttempts.trim() ? parseInt(state.form.maxQuizAttempts, 10) : null,
    isPublished: state.isPublished,
    ...(state.form.categoryNameAr.trim() || state.form.categoryNameEn.trim()
      ? { categoryNameAr: state.form.categoryNameAr.trim(), categoryNameEn: state.form.categoryNameEn.trim() }
      : state.form.categoryId
        ? { categoryId: state.form.categoryId }
        : {}),
    lessons: state.lessons.map((l) => ({
      title: l.title,
      videoUrl: l.videoUrl || undefined,
      content: l.content || undefined,
      pdfUrl: l.pdfUrl || undefined,
      acceptsHomework: l.acceptsHomework,
      homeworkImageUrl: l.acceptsHomework ? l.homeworkImageUrl || undefined : undefined,
    })),
    quizzes: state.quizzes.map((q) => ({
      title: q.title,
      timeLimitMinutes: (() => {
        const n = parseInt(q.timeLimitMinutes, 10);
        return Number.isFinite(n) && n >= 1 ? n : undefined;
      })(),
      questions: q.questions.map((qt) => ({
        type: qt.type,
        questionText: qt.questionText,
        questionImageUrl: qt.questionImageUrl || undefined,
        options:
          qt.type === "MULTIPLE_CHOICE"
            ? qt.options
            : qt.type === "TRUE_FALSE"
              ? qt.options
              : undefined,
      })),
    })),
    contentOrder: state.contentOrder,
  };
}
