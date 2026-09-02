import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePlaybackOtp, getVideoStatus, isVdoCipherConfigured } from "@/lib/vdocipher";
import { normalizeVdoCipherVideoId } from "@/lib/vdocipher-video-id";

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

  let body: { videoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const videoId = normalizeVdoCipherVideoId(body.videoId);
  if (!videoId) {
    return NextResponse.json({ error: "videoId مطلوب" }, { status: 400 });
  }

  try {
    const status = await getVideoStatus(videoId);
    if (status.status !== "ready") {
      return NextResponse.json(
        {
          error: "الفيديو قيد المعالجة",
          status: status.status,
        },
        { status: 409 },
      );
    }

    const { otp, playbackInfo } = await generatePlaybackOtp(videoId, { ttl: 300 });
    return NextResponse.json({ otp, playbackInfo, videoId });
  } catch (e) {
    console.error("VdoCipher preview OTP error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل تحميل معاينة الفيديو" },
      { status: 500 },
    );
  }
}
