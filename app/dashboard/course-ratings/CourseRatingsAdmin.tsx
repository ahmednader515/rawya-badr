"use client";

import { useState, useEffect, useCallback } from "react";
import { useT } from "@/components/LocaleProvider";

type RatingRow = {
  id: string;
  courseId: string;
  courseTitle: string | null;
  courseSlug: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  stars: number;
  comment: string | null;
  createdAt: string;
};

function StarDisplay({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} stars`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <span key={v} className={v <= stars ? "text-amber-400" : "text-[var(--color-border)]"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function CourseRatingsAdmin({ isAdmin }: { isAdmin: boolean }) {
  const t = useT();
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const LIMIT = 20;

  const load = useCallback(
    async (p: number, filter: string) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (filter.trim()) params.set("courseId", filter.trim());
        const res = await fetch(`/api/dashboard/course-ratings?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(t("dashboard.courseRatingsPage.loadFailed", "Failed to load ratings"));
        const data = (await res.json()) as {
          rows: RatingRow[];
          total: number;
        };
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("dashboard.courseRatingsPage.loadFailed", "Failed to load ratings"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void load(page, courseFilter);
  }, [load, page, courseFilter]);

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch("/api/dashboard/course-ratings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? t("dashboard.courseRatingsPage.deleteFailed", "Failed to delete"));
      setConfirmDeleteId(null);
      void load(page, courseFilter);
    } catch (e) {
      alert(e instanceof Error ? e.message : t("dashboard.courseRatingsPage.deleteFailed", "Failed to delete"));
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          {t("dashboard.courseRatingsPage.totalLabel", "Total ratings:")} <strong>{total}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--color-muted)]">
            {t("dashboard.courseRatingsPage.loading", "Loading…")}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-muted)]">
            {t("dashboard.courseRatingsPage.empty", "No ratings yet.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-background)]/60">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.courseRatingsPage.colCourse", "Course")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.courseRatingsPage.colStudent", "Student")}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.courseRatingsPage.colStars", "Rating")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.courseRatingsPage.colComment", "Comment")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.courseRatingsPage.colDate", "Date")}
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-foreground)]">
                      {t("dashboard.courseRatingsPage.colActions", "Actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition hover:bg-[var(--color-background)]/50"
                  >
                    {/* Course */}
                    <td className="px-4 py-3">
                      {row.courseSlug ? (
                        <a
                          href={`/courses/${encodeURIComponent(row.courseSlug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {row.courseTitle ?? row.courseId}
                        </a>
                      ) : (
                        <span className="font-medium text-[var(--color-foreground)]">
                          {row.courseTitle ?? row.courseId}
                        </span>
                      )}
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {row.userName ?? "—"}
                      </p>
                      {row.userEmail && (
                        <p className="text-xs text-[var(--color-muted)]">{row.userEmail}</p>
                      )}
                    </td>

                    {/* Stars */}
                    <td className="px-4 py-3 text-center">
                      <StarDisplay stars={row.stars} />
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{row.stars}/5</p>
                    </td>

                    {/* Comment */}
                    <td className="max-w-xs px-4 py-3">
                      {row.comment ? (
                        <p className="line-clamp-3 text-[var(--color-foreground)]">{row.comment}</p>
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(row.createdAt)}
                    </td>

                    {/* Delete (admin only) */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className={
                            confirmDeleteId === row.id
                              ? "text-xs font-semibold text-red-600 hover:underline"
                              : "text-xs text-red-500 hover:underline disabled:opacity-50"
                          }
                        >
                          {deletingId === row.id
                            ? t("dashboard.courseRatingsPage.deleting", "Deleting…")
                            : confirmDeleteId === row.id
                              ? t("dashboard.courseRatingsPage.confirmDelete", "Confirm delete?")
                              : t("dashboard.courseRatingsPage.delete", "Delete")}
                        </button>
                        {confirmDeleteId === row.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="ms-2 text-xs text-[var(--color-muted)] hover:underline"
                          >
                            {t("dashboard.courseRatingsPage.cancelDelete", "Cancel")}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
