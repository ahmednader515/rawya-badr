import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllCourseRatings, deleteCourseRating } from "@/lib/db";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const courseId = searchParams.get("courseId") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const result = await getAllCourseRatings({ courseId, limit, offset });
    return NextResponse.json({ ...result, page, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر تحميل التقييمات";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: "معرف التقييم مطلوب" }, { status: 400 });

  try {
    await deleteCourseRating(body.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر حذف التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
