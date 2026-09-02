import { NextResponse } from "next/server";
import {
  generatePlaybackOtp,
  getDrmSentinelVideoId,
  getVideoStatus,
  isDrmSentinelConfigured,
  DRM_SENTINEL_OTP_TTL_SECONDS,
  getVdoCipherPlayerIdForClient,
} from "@/lib/vdocipher";

/** Public OTP for the hidden sentinel clip — no lesson content, guests + students only on the client. */
export async function POST() {
  if (!isDrmSentinelConfigured()) {
    return NextResponse.json({ error: "DRM sentinel غير مضبوط" }, { status: 503 });
  }

  const videoId = getDrmSentinelVideoId();
  if (!videoId) {
    return NextResponse.json({ error: "DRM sentinel غير مضبوط" }, { status: 503 });
  }

  try {
    const status = await getVideoStatus(videoId);
    if (status.status !== "ready") {
      return NextResponse.json(
        { error: "فيديو الحماية قيد المعالجة", status: status.status },
        { status: 409 },
      );
    }

    const { otp, playbackInfo } = await generatePlaybackOtp(videoId, {
      ttl: DRM_SENTINEL_OTP_TTL_SECONDS,
    });

    return NextResponse.json({
      otp,
      playbackInfo,
      ttl: DRM_SENTINEL_OTP_TTL_SECONDS,
      ...getVdoCipherPlayerIdForClient(),
    });
  } catch (e) {
    console.error("VdoCipher DRM sentinel OTP error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل تحميل حماية DRM" },
      { status: 500 },
    );
  }
}
