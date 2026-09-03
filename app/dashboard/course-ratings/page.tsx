import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseRatingsAdmin } from "./CourseRatingsAdmin";

export default async function CourseRatingsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN") redirect("/dashboard");

  const t = await getServerTranslator();

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseRatingsPage.title", "Course ratings")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.courseRatingsPage.subtitle",
          "View all student ratings and comments submitted for courses.",
        )}
      </p>
      <CourseRatingsAdmin isAdmin={role === "ADMIN"} />
    </div>
  );
}
