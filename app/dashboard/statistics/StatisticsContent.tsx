"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { Locale } from "@/lib/i18n/types";

type CertificateRow = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  courseId: string;
  courseTitle: string | null;
  courseTitleAr: string | null;
  courseSlug: string | null;
  certificateCode: string;
  issuedAt: string;
};

type CourseInfo = { title: string; titleAr: string | null };

type EnrollmentInfo = { course: CourseInfo };

type StudentWithDetails = {
  student: { id: string; name: string | null; email: string | null };
  enrollments: EnrollmentInfo[];
  completedCourses: CertificateRow[];
};

type Props = {
  studentsCount: number;
  totalEnrollments: number;
  certificatesCount: number;
  totalEarnings: number;
  certificates: CertificateRow[];
  studentsWithDetails: StudentWithDetails[];
  titleSuffix?: string;
};

function formatDate(d: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocaleForUi(locale), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(typeof d === "string" ? new Date(d) : d);
}

function courseDisplayTitle(course: { title: string | null; titleAr?: string | null }, locale: Locale) {
  if (locale === "ar") return course.titleAr?.trim() || course.title || "—";
  return course.title?.trim() || course.titleAr?.trim() || "—";
}

export default function StatisticsContent({
  studentsCount,
  totalEnrollments,
  certificatesCount,
  totalEarnings,
  certificates,
  studentsWithDetails,
  titleSuffix = "",
}: Props) {
  const t = useT();
  const locale = useLocale();
  const { dir, thClassCompact } = useDashboardTable();
  const [searchQuery, setSearchQuery] = useState("");
  const egp = t("common.egyptianPoundShort", "EGP");

  const trimmed = searchQuery.trim().toLowerCase();

  const filteredCertificates = useMemo(() => {
    if (!trimmed) return certificates;
    return certificates.filter((c) => {
      const name = (c.userName ?? "").toLowerCase();
      const email = (c.userEmail ?? "").toLowerCase();
      const course = `${c.courseTitle ?? ""} ${c.courseTitleAr ?? ""}`.toLowerCase();
      const code = (c.certificateCode ?? "").toLowerCase();
      return (
        name.includes(trimmed) ||
        email.includes(trimmed) ||
        course.includes(trimmed) ||
        code.includes(trimmed)
      );
    });
  }, [certificates, trimmed]);

  const filteredStudentsWithDetails = useMemo(() => {
    if (!trimmed) return studentsWithDetails;
    return studentsWithDetails.filter((swd) => {
      const name = (swd.student.name ?? "").toLowerCase();
      const email = (swd.student.email ?? "").toLowerCase();
      return name.includes(trimmed) || email.includes(trimmed);
    });
  }, [studentsWithDetails, trimmed]);

  const pq = `dashboard.statisticsPage`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {t(`${pq}.title`, "Student statistics")}
          {titleSuffix ? ` ${titleSuffix}` : ""}
        </h2>
        <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          {t("dashboard.backToDashboard", "← Back to dashboard")}
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="student-search" className="mb-2 block text-sm font-medium text-[var(--color-foreground)]">
          {t(`${pq}.studentSearchLabel`, "Find a student")}
        </label>
        <input
          id="student-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(`${pq}.studentSearchPlaceholder`, "Student name or email…")}
          className="w-full max-w-md rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          dir={locale === "ar" ? "rtl" : "ltr"}
        />
        {trimmed && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {fillMessage(
              t(`${pq}.filterSummary`, "Showing {students} students, {certificates} certificates"),
              {
                students: String(filteredStudentsWithDetails.length),
                certificates: String(filteredCertificates.length),
              },
            )}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardStudents`, "Students")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{studentsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardEnrollments`, "Total course enrollments")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{totalEnrollments}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardCertificates`, "Certificates issued")}</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{certificatesCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/20 p-4">
          <p className="text-sm text-[var(--color-muted)]">{t(`${pq}.cardEarningsTitle`, "Total platform earnings")}</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {totalEarnings.toFixed(2)} {egp}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t(`${pq}.cardEarningsHint`, "From student balance paid to enroll in courses")}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${pq}.sectionCompletedCertificates`, "Completed courses & certificates")}
        </h3>
        {filteredCertificates.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed
              ? t(`${pq}.noCertificatesFiltered`, "No results match your search.")
              : t(`${pq}.noCertificatesEmpty`, "No certificates issued yet.")}
          </p>
        ) : (
          <div dir={dir} className="overflow-x-auto">
            <table dir={dir} className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className={thClassCompact}>{t(`${pq}.colStudent`, "Student")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colEmail`, "Email")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colCourse`, "Course")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colCertificate`, "Certificate")}</th>
                  <th className={thClassCompact}>{t(`${pq}.colDate`, "Date")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)]/50">
                    <td className="px-3 py-2 text-[var(--color-foreground)]">{c.userName}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{c.userEmail}</td>
                    <td className="px-3 py-2 text-[var(--color-foreground)]">
                      {courseDisplayTitle(
                        { title: c.courseTitle, titleAr: c.courseTitleAr },
                        locale,
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[var(--color-foreground)]">
                      {c.certificateCode}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">
                      {formatDate(c.issuedAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${pq}.sectionStudentsEnrollments`, "Students & enrollments")}
        </h3>
        {filteredStudentsWithDetails.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {trimmed
              ? t(`${pq}.noStudentsFiltered`, "No results match your search.")
              : t(`${pq}.noStudentsEmpty`, "No students registered.")}
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredStudentsWithDetails.map(({ student: s, enrollments, completedCourses }) => (
              <li
                key={s.id}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{s.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{s.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                    <span>
                      {fillMessage(t(`${pq}.enrolledInCourses`, "Enrolled in {count} course(s)"), {
                        count: String(enrollments.length),
                      })}
                    </span>
                    <span>
                      {fillMessage(
                        t(`${pq}.completedCoursesCount`, "Completed: {count}"),
                        { count: String(completedCourses.length) },
                      )}
                    </span>
                  </div>
                </div>
                {enrollments.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    {t(`${pq}.coursesLabel`, "Courses:")}{" "}
                    {enrollments
                      .map((e) => courseDisplayTitle(e.course, locale))
                      .join(locale === "ar" ? "، " : ", ")}
                  </p>
                )}
                {completedCourses.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-t border-[var(--color-border)]/60 pt-3">
                    <li className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      {t(`${pq}.completedWithCertificate`, "Completed courses & certificates")}
                    </li>
                    {completedCourses.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="text-[var(--color-foreground)]">
                          {courseDisplayTitle(
                            { title: c.courseTitle, titleAr: c.courseTitleAr },
                            locale,
                          )}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-primary)]">
                          {c.certificateCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {t(`${pq}.noCompletedYet`, "No completed courses / certificates yet.")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
