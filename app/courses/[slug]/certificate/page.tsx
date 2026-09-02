import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getCourseCertificateForUser,
  getHomepageSettings,
  getUserById,
} from "@/lib/db";
import { CertificateView } from "@/components/CertificateView";
import { CertificateDownloadButton } from "@/components/CertificateDownloadButton";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function courseHref(course: { slug?: string | null; id: string }): string {
  const segment = course.slug?.trim() ? encodeURIComponent(course.slug.trim()) : course.id;
  return `/courses/${segment}`;
}

function certificateSeg(course: { slug?: string | null; id: string }): string {
  const s = course.slug?.trim() ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : course.id;
}

export default async function CourseCertificatePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const t = await getServerTranslator();
  const { slug: segment } = await params;
  const data = await getCourseWithContent(decodeSlug(segment));
  if (!data?.course) notFound();

  const course = data.course;
  const certificate = await getCourseCertificateForUser(session.user.id, course.id);
  if (!certificate) notFound();

  const user = await getUserById(session.user.id);
  const template = await getHomepageSettings();

  const certRow = certificate as typeof certificate & {
    issuedAt?: Date | string;
  };
  const issuedAtRaw = certRow.issued_at ?? certRow.issuedAt;
  const issuedAt =
    issuedAtRaw instanceof Date
      ? issuedAtRaw
      : issuedAtRaw
        ? new Date(String(issuedAtRaw))
        : new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:max-w-none">
      <div className="mb-6 print:hidden">
        <Link
          href={courseHref(course)}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← {t("courses.backToCourse", "Back to course")}
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)] print:hidden">
        {t("courses.yourCertificate", "Your certificate")}
      </h1>

      <CertificateView
        studentName={user?.name ?? session.user.name ?? ""}
        issuedAt={Number.isNaN(issuedAt.getTime()) ? new Date() : issuedAt}
        template={template}
      />

      <div className="mt-8 flex flex-col items-center gap-3 print:hidden">
        <CertificateDownloadButton />
        <p className="text-center text-xs text-[var(--color-muted)]">
          {t("courses.certificatePrintHint", "Use your browser print (Ctrl+P) to save as PDF.")}
        </p>
      </div>
    </div>
  );
}

export { certificateSeg };
