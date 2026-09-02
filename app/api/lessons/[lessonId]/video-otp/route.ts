import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ensureUserCopyrightCode,
  getHomepageSettings,
} from "@/lib/db";
import { canUserAccessLessonVideo } from "@/lib/lesson-video-access";
import { generatePlaybackOtp, getVideoStatus, isVdoCipherConfigured } from "@/lib/vdocipher";
import { normalizeVdoCipherVideoId } from "@/lib/vdocipher-video-id";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

  if (!isVdoCipherConfigured()) {
    return NextResponse.json(
      { error: "VdoCipher غير مضبوط. أضف VDOCIPHER_API_KEY في متغيرات البيئة." },
      { status: 503 },
    );
  }

  const { lessonId } = await context.params;
  const { allowed, lesson } = await canUserAccessLessonVideo({
    userId: session.user.id,
    role: session.user.role,
    lessonId,
  });

  if (!allowed || !lesson) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const videoId = normalizeVdoCipherVideoId(lesson.video_url);
  if (!videoId) {
    return NextResponse.json({ error: "لا يوجد فيديو لهذه الحصة" }, { status: 404 });
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

    let copyrightCode: string | null = null;
    if (session.user.role === "STUDENT") {
      copyrightCode = await ensureUserCopyrightCode(session.user.id);
    }

    const homepageSettings = await getHomepageSettings();
    const copyrightOverlayStyle =
      homepageSettings.copyrightOverlayStyle === "watermark" ? "watermark" : "floating";

    const { otp, playbackInfo } = await generatePlaybackOtp(videoId, {
      copyrightCode,
      copyrightOverlayStyle,
      ttl: 300,
    });

    return NextResponse.json({ otp, playbackInfo, videoId });
  } catch (e) {
    console.error("VdoCipher OTP error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل تحميل الفيديو" },
      { status: 500 },
    );
  }
}
