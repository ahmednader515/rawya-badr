import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { duplicateCourse, getCourseById } from "@/lib/db";
import { canManageCourse } from "@/lib/permissions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  const createdBy =
    (course as { createdById?: string | null; created_by_id?: string | null }).createdById ??
    (course as { created_by_id?: string | null }).created_by_id ??
    null;
  if (!canManageCourse(session.user.role, session.user.id, createdBy)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const copy = await duplicateCourse(id, session.user.id);
    return NextResponse.json({ id: copy.id });
  } catch (e) {
    console.error("duplicate course error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل نسخ الدورة" },
      { status: 500 },
    );
  }
}
