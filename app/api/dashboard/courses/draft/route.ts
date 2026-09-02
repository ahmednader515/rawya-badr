import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCourse,
  getCourseForEdit,
  getLatestDraftCourseForCreator,
} from "@/lib/db";

function canManageCourses(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

/** GET latest draft for current user. POST create empty draft course. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCourses(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const draft = await getLatestDraftCourseForCreator(session.user.id);
  if (!draft) {
    return NextResponse.json({ draft: null });
  }

  const data = await getCourseForEdit(String(draft.id));
  if (!data?.course) {
    return NextResponse.json({ draft: null });
  }

  return NextResponse.json({ draft: { id: String(draft.id), ...data } });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCourses(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let forceNew = false;
  try {
    const body = await request.json();
    forceNew = Boolean(body?.forceNew);
  } catch {
    /* empty body is fine */
  }

  if (!forceNew) {
    const existing = await getLatestDraftCourseForCreator(session.user.id);
    if (existing?.id) {
      return NextResponse.json({ id: String(existing.id), resumed: true });
    }
  }

  const slug = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const course = await createCourse({
      title: "Draft",
      title_ar: "مسودة",
      slug,
      description: "-",
      description_en: "-",
      price: 0,
      is_published: false,
      created_by_id: session.user.id,
    });
    return NextResponse.json({ id: course.id, resumed: false });
  } catch (e) {
    console.error("create draft course error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل إنشاء المسودة" },
      { status: 500 },
    );
  }
}
