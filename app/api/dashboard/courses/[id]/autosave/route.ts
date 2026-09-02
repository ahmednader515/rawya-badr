import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { autosaveCourse } from "@/lib/course-autosave";
import type { CourseAutosaveBody } from "@/lib/course-content-save";
import type { UserRole } from "@/lib/types";

function canManageCourses(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCourses(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  let body: CourseAutosaveBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const forceDraft = request.nextUrl.searchParams.get("publish") !== "1";
  return autosaveCourse(id, body, session.user.id, session.user.role as UserRole, { forceDraft });
}
