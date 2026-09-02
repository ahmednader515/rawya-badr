import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVideoStatus, isVdoCipherConfigured } from "@/lib/vdocipher";

function canUploadVideo(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

export async function GET(request: NextRequest) {
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

  const videoId = request.nextUrl.searchParams.get("videoId")?.trim();
  if (!videoId) {
    return NextResponse.json({ error: "videoId مطلوب" }, { status: 400 });
  }

  try {
    const details = await getVideoStatus(videoId);
    return NextResponse.json(details);
  } catch (e) {
    console.error("VdoCipher status error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل التحقق من حالة الفيديو" },
      { status: 500 },
    );
  }
}
