import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isVdoCipherConfigured, listVdoCipherVideos } from "@/lib/vdocipher";

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

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const query = request.nextUrl.searchParams.get("q") ?? "";

  try {
    const list = await listVdoCipherVideos({
      page: Number.isFinite(page) ? page : 1,
      query,
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("VdoCipher library error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل جلب مكتبة الفيديو" },
      { status: 500 },
    );
  }
}
