import { NextResponse } from "next/server";
import { canManageCourse } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import {
  createCategory,
  categoryIsManageableOnDashboard,
  createLesson,
  createQuiz,
  createQuestion,
  createQuestionOption,
  deleteLessonsByCourseId,
  deleteQuizzesByCourseId,
  findCategoryByNameForDashboard,
  getCourseById,
  updateCourse,
} from "@/lib/db";
import {
  filterContentOrder,
  normalizeDraftCourseFields,
  prepareLessonsForSave,
  prepareQuizzesForSave,
  saveCourseLessonsAndQuizzes,
  type CourseAutosaveBody,
} from "@/lib/course-content-save";

const saveDeps = {
  deleteLessonsByCourseId,
  deleteQuizzesByCourseId,
  createLesson,
  createQuiz,
  createQuestion,
  createQuestionOption,
};

async function resolveCategoryId(
  body: CourseAutosaveBody,
  userId: string,
  role: UserRole,
  currentCategoryId: string | null,
): Promise<{ id?: string | null; invalid?: boolean }> {
  const catNameAr = body.categoryNameAr?.trim();
  const catNameEn = body.categoryNameEn?.trim();
  if (catNameAr || catNameEn) {
    let cat =
      (catNameAr ? await findCategoryByNameForDashboard(catNameAr, userId, role) : null) ??
      (catNameEn ? await findCategoryByNameForDashboard(catNameEn, userId, role) : null);
    if (!cat) {
      const slugBase = catNameEn || catNameAr || "cat";
      const slugCat = slugBase.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]+/g, "") || "cat";
      cat = await createCategory({
        name: catNameEn || catNameAr || slugBase,
        name_ar: catNameAr || catNameEn || slugBase,
        slug: `${slugCat}-${Date.now()}`,
        created_by_id: userId,
      });
    }
    return { id: cat.id };
  }

  if (body.categoryId === undefined) {
    return {};
  }

  if (body.categoryId === null || body.categoryId === "") {
    return { id: null };
  }

  const incoming = String(body.categoryId).trim();
  if (incoming !== currentCategoryId) {
    const ok = await categoryIsManageableOnDashboard(incoming, userId, role);
    if (!ok) return { invalid: true };
  }
  return { id: incoming };
}

export async function autosaveCourse(
  courseId: string,
  body: CourseAutosaveBody,
  userId: string,
  role: UserRole,
  options: { forceDraft?: boolean },
) {
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  const createdBy =
    (course as { createdById?: string | null }).createdById ??
    (course as { created_by_id?: string | null }).created_by_id ??
    null;
  if (!canManageCourse(role, userId, createdBy)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const slug = String((course as { slug?: string }).slug ?? courseId);
  const currentCategoryId =
    (course as { categoryId?: string | null }).categoryId ??
    (course as { category_id?: string | null }).category_id ??
    null;

  const normalized = normalizeDraftCourseFields(body);
  const categoryResult = await resolveCategoryId(body, userId, role, currentCategoryId);
  if (categoryResult.invalid) {
    return NextResponse.json({ error: "القسم غير صالح أو غير مسموح" }, { status: 400 });
  }

  const lessons = prepareLessonsForSave(body.lessons, true);
  const quizzes = prepareQuizzesForSave(body.quizzes, true);
  const contentOrder = filterContentOrder(body.contentOrder, lessons.length, quizzes.length);

  const isPublished = options.forceDraft
    ? false
    : body.isPublished ??
      Boolean((course as { isPublished?: boolean }).isPublished ?? (course as { is_published?: boolean }).is_published ?? false);

  await updateCourse(courseId, {
    title: normalized.titleEn,
    title_ar: normalized.titleAr,
    description: normalized.descriptionAr,
    description_en: normalized.descriptionEn,
    short_desc: normalized.shortDescAr,
    short_desc_en: normalized.shortDescEn,
    image_url: normalized.imageUrl,
    price: normalized.price,
    is_published: isPublished,
    max_quiz_attempts: normalized.maxQuizAttempts,
    ...(categoryResult.id !== undefined && { category_id: categoryResult.id }),
    ...(body.acceptsHomework !== undefined && { accepts_homework: body.acceptsHomework }),
  });

  await saveCourseLessonsAndQuizzes(courseId, slug, lessons, quizzes, contentOrder, saveDeps);

  return NextResponse.json({ id: courseId, savedAt: new Date().toISOString() });
}
