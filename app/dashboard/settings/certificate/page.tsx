import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
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
          certificateNameTop: settings.certificateNameTop ?? 48,
          certificateNameLeft: settings.certificateNameLeft ?? 50,
          certificateDateTop: settings.certificateDateTop ?? 56,
          certificateDateLeft: settings.certificateDateLeft ?? 50,
        }}
      />
    </div>
  );
}
