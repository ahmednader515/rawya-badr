import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUploadCredentials, isVdoCipherConfigured } from "@/lib/vdocipher";

function canUploadVideo(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canUploadVideo(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!isVdoCipherConfigured()) {
    return NextResponse.json(
      { error: "VdoCipher غير مضبوط. أضف VDOCIPHER_API_KEY في متغيرات البيئة." },
      { status: 503 },
    );
  }

  let body: { title?: string; folderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "عنوان الفيديو مطلوب" }, { status: 400 });
  }

  try {
    const credentials = await getUploadCredentials(title, body.folderId);
    return NextResponse.json(credentials);
  } catch (e) {
    console.error("VdoCipher credentials error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الحصول على بيانات الرفع" },
      { status: 500 },
    );
  }
}
