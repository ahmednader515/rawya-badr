import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { CERTIFICATE_POSITION_DEFAULTS as D } from "@/lib/certificate-layout";
import { getServerTranslator } from "@/lib/i18n/server";
import { CertificateSettingsForm } from "./CertificateSettingsForm";

export default async function DashboardCertificateSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  const settings = await getHomepageSettings();

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.certificateRoutePage.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t("dashboard.certificateRoutePage.subtitle")}
      </p>
      <CertificateSettingsForm
        initial={{
          certificateBackgroundUrl: settings.certificateBackgroundUrl ?? "",
          certificateNameTop: settings.certificateNameTop ?? D.nameTop,
          certificateNameLeft: settings.certificateNameLeft ?? D.nameLeft,
          certificateDateTop: settings.certificateDateTop ?? D.dateTop,
          certificateDateLeft: settings.certificateDateLeft ?? D.dateLeft,
          certificateCourseCodeTop: settings.certificateCourseCodeTop ?? D.courseCodeTop,
          certificateCourseCodeLeft: settings.certificateCourseCodeLeft ?? D.courseCodeLeft,
          certificateCourseNameTop: settings.certificateCourseNameTop ?? D.courseNameTop,
          certificateCourseNameLeft: settings.certificateCourseNameLeft ?? D.courseNameLeft,
          certificateCertTypeTop: settings.certificateCertTypeTop ?? D.certTypeTop,
          certificateCertTypeLeft: settings.certificateCertTypeLeft ?? D.certTypeLeft,
          certificateCreditPointsTop: settings.certificateCreditPointsTop ?? D.creditPointsTop,
          certificateCreditPointsLeft: settings.certificateCreditPointsLeft ?? D.creditPointsLeft,
          certificateCreditTypeTop: settings.certificateCreditTypeTop ?? D.creditTypeTop,
          certificateCreditTypeLeft: settings.certificateCreditTypeLeft ?? D.creditTypeLeft,
        }}
      />
    </div>
  );
}
