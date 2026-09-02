import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseCertificatePosition } from "@/lib/certificate-layout";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";

function parseBodyPosition(value: unknown, fallback: number): number {
  return parseCertificatePosition(value, fallback);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const s = await getHomepageSettings();
    return NextResponse.json({
      certificateBackgroundUrl: s.certificateBackgroundUrl ?? "",
      certificateNameTop: s.certificateNameTop ?? 48,
      certificateNameLeft: s.certificateNameLeft ?? 50,
      certificateDateTop: s.certificateDateTop ?? 56,
      certificateDateLeft: s.certificateDateLeft ?? 50,
    });
  } catch {
    return NextResponse.json({ error: "فشل جلب الإعدادات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    await updateHomepageSettings({
      certificate_background_url:
        body.certificateBackgroundUrl != null ? String(body.certificateBackgroundUrl).trim() || null : undefined,
      certificate_name_top:
        body.certificateNameTop != null ? parseBodyPosition(body.certificateNameTop, 48) : undefined,
      certificate_name_left:
        body.certificateNameLeft != null ? parseBodyPosition(body.certificateNameLeft, 50) : undefined,
      certificate_date_top:
        body.certificateDateTop != null ? parseBodyPosition(body.certificateDateTop, 56) : undefined,
      certificate_date_left:
        body.certificateDateLeft != null ? parseBodyPosition(body.certificateDateLeft, 50) : undefined,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ الإعدادات" }, { status: 500 });
  }
}
