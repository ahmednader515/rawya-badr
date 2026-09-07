import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CERTIFICATE_POSITION_DEFAULTS, parseCertificatePosition } from "@/lib/certificate-layout";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";

function parseBodyPosition(value: unknown, fallback: number): number {
  return parseCertificatePosition(value, fallback);
}

const D = CERTIFICATE_POSITION_DEFAULTS;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const s = await getHomepageSettings();
    return NextResponse.json({
      certificateBackgroundUrl: s.certificateBackgroundUrl ?? "",
      certificateNameTop: s.certificateNameTop ?? D.nameTop,
      certificateNameLeft: s.certificateNameLeft ?? D.nameLeft,
      certificateDateTop: s.certificateDateTop ?? D.dateTop,
      certificateDateLeft: s.certificateDateLeft ?? D.dateLeft,
      certificateCourseCodeTop: s.certificateCourseCodeTop ?? D.courseCodeTop,
      certificateCourseCodeLeft: s.certificateCourseCodeLeft ?? D.courseCodeLeft,
      certificateCourseNameTop: s.certificateCourseNameTop ?? D.courseNameTop,
      certificateCourseNameLeft: s.certificateCourseNameLeft ?? D.courseNameLeft,
      certificateCertTypeTop: s.certificateCertTypeTop ?? D.certTypeTop,
      certificateCertTypeLeft: s.certificateCertTypeLeft ?? D.certTypeLeft,
      certificateCreditPointsTop: s.certificateCreditPointsTop ?? D.creditPointsTop,
      certificateCreditPointsLeft: s.certificateCreditPointsLeft ?? D.creditPointsLeft,
      certificateCreditTypeTop: s.certificateCreditTypeTop ?? D.creditTypeTop,
      certificateCreditTypeLeft: s.certificateCreditTypeLeft ?? D.creditTypeLeft,
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
        body.certificateBackgroundUrl != null
          ? String(body.certificateBackgroundUrl).trim() || null
          : undefined,
      certificate_name_top:
        body.certificateNameTop != null ? parseBodyPosition(body.certificateNameTop, D.nameTop) : undefined,
      certificate_name_left:
        body.certificateNameLeft != null ? parseBodyPosition(body.certificateNameLeft, D.nameLeft) : undefined,
      certificate_date_top:
        body.certificateDateTop != null ? parseBodyPosition(body.certificateDateTop, D.dateTop) : undefined,
      certificate_date_left:
        body.certificateDateLeft != null ? parseBodyPosition(body.certificateDateLeft, D.dateLeft) : undefined,
      certificate_course_code_top:
        body.certificateCourseCodeTop != null
          ? parseBodyPosition(body.certificateCourseCodeTop, D.courseCodeTop)
          : undefined,
      certificate_course_code_left:
        body.certificateCourseCodeLeft != null
          ? parseBodyPosition(body.certificateCourseCodeLeft, D.courseCodeLeft)
          : undefined,
      certificate_course_name_top:
        body.certificateCourseNameTop != null
          ? parseBodyPosition(body.certificateCourseNameTop, D.courseNameTop)
          : undefined,
      certificate_course_name_left:
        body.certificateCourseNameLeft != null
          ? parseBodyPosition(body.certificateCourseNameLeft, D.courseNameLeft)
          : undefined,
      certificate_cert_type_top:
        body.certificateCertTypeTop != null
          ? parseBodyPosition(body.certificateCertTypeTop, D.certTypeTop)
          : undefined,
      certificate_cert_type_left:
        body.certificateCertTypeLeft != null
          ? parseBodyPosition(body.certificateCertTypeLeft, D.certTypeLeft)
          : undefined,
      certificate_credit_points_top:
        body.certificateCreditPointsTop != null
          ? parseBodyPosition(body.certificateCreditPointsTop, D.creditPointsTop)
          : undefined,
      certificate_credit_points_left:
        body.certificateCreditPointsLeft != null
          ? parseBodyPosition(body.certificateCreditPointsLeft, D.creditPointsLeft)
          : undefined,
      certificate_credit_type_top:
        body.certificateCreditTypeTop != null
          ? parseBodyPosition(body.certificateCreditTypeTop, D.creditTypeTop)
          : undefined,
      certificate_credit_type_left:
        body.certificateCreditTypeLeft != null
          ? parseBodyPosition(body.certificateCreditTypeLeft, D.creditTypeLeft)
          : undefined,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ الإعدادات" }, { status: 500 });
  }
}
