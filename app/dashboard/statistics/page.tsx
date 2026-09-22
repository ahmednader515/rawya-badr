import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getUsersByRole,
  getEnrollmentsWithCourseByUserId,
  getTotalPlatformEarnings,
  getStudentsEnrolledInTeacherCourses,
  getTotalEarningsForTeacher,
  getCoursesWithCountsForCreator,
  listAllCourseCertificatesForAdmin,
  listCourseCertificatesForTeacher,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import StatisticsContent from "./StatisticsContent";

function serializeCert(c: {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  courseId: string;
  courseTitle: string | null;
  courseTitleAr: string | null;
  courseSlug: string | null;
  certificateCode: string;
  issuedAt: Date | string;
}) {
  return {
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    userEmail: c.userEmail,
    courseId: c.courseId,
    courseTitle: c.courseTitle,
    courseTitleAr: c.courseTitleAr,
    courseSlug: c.courseSlug,
    certificateCode: c.certificateCode,
    issuedAt: typeof c.issuedAt === "string" ? c.issuedAt : c.issuedAt.toISOString(),
  };
}

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  if (role === "TEACHER") {
    const teacherId = session.user.id;
    const [students, certificates, totalEarnings, myCourses] = await Promise.all([
      getStudentsEnrolledInTeacherCourses(teacherId),
      listCourseCertificatesForTeacher(teacherId).catch(() => []),
      getTotalEarningsForTeacher(teacherId),
      getCoursesWithCountsForCreator(teacherId),
    ]);
    const myCourseIds = new Set(myCourses.map((row) => String((row as { id?: unknown }).id ?? "")));

    const enrollmentsByUser = await Promise.all(
      students.map(async (s) => {
        const all = await getEnrollmentsWithCourseByUserId(s.id);
        return all.filter((e) => myCourseIds.has(e.course.id));
      }),
    );

    const totalEnrollments = enrollmentsByUser.reduce((sum, e) => sum + e.length, 0);
    const certificatesSerialized = certificates.map(serializeCert);

    const studentsWithDetails = students.map((s, i) => {
      const enrollments = enrollmentsByUser[i] ?? [];
      const completed = certificatesSerialized.filter((c) => c.userId === s.id);
      return {
        student: { id: s.id, name: s.name, email: s.email },
        enrollments: enrollments.map((e) => ({
          course: { title: e.course.title, titleAr: e.course.titleAr ?? null },
        })),
        completedCourses: completed,
      };
    });

    return (
      <StatisticsContent
        studentsCount={students.length}
        totalEnrollments={totalEnrollments}
        certificatesCount={certificates.length}
        totalEarnings={totalEarnings}
        certificates={certificatesSerialized}
        studentsWithDetails={studentsWithDetails}
        titleSuffix={t("dashboard.statisticsPage.titleSuffixTeacher", "(your courses)")}
      />
    );
  }

  const [students, certificates, totalEarnings] = await Promise.all([
    getUsersByRole("STUDENT"),
    listAllCourseCertificatesForAdmin().catch(() => []),
    getTotalPlatformEarnings(),
  ]);

  const enrollmentsByUser = await Promise.all(
    students.map((s) => getEnrollmentsWithCourseByUserId(s.id)),
  );

  const totalEnrollments = enrollmentsByUser.reduce((sum, e) => sum + e.length, 0);
  const certificatesSerialized = certificates.map(serializeCert);

  const studentsWithDetails = students.map((s, i) => {
    const enrollments = enrollmentsByUser[i] ?? [];
    const completed = certificatesSerialized.filter((c) => c.userId === s.id);
    return {
      student: { id: s.id, name: s.name, email: s.email },
      enrollments: enrollments.map((e) => ({
        course: { title: e.course.title, titleAr: e.course.titleAr ?? null },
      })),
      completedCourses: completed,
    };
  });

  return (
    <StatisticsContent
      studentsCount={students.length}
      totalEnrollments={totalEnrollments}
      certificatesCount={certificates.length}
      totalEarnings={totalEarnings}
      certificates={certificatesSerialized}
      studentsWithDetails={studentsWithDetails}
      titleSuffix=""
    />
  );
}
