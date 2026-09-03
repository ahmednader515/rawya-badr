"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";

type Props = {
  courseSlug: string;
  certificateHref: string;
  existingStars?: number | null;
  existingComment?: string | null;
};

export function CourseRatingForm({
  courseSlug,
  certificateHref,
  existingStars = null,
  existingComment = null,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [stars, setStars] = useState<number>(existingStars ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingComment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const displayStars = hovered || stars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars < 1) {
      setError(t("courses.courseRatingStarsRequired", "Please select a star rating."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseSlug)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stars, comment: comment.trim() || null }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("courses.courseRatingSaveFailed", "Failed to save your rating."));
        return;
      }
      setSubmitted(true);
      router.push(certificateHref);
    } catch {
      setError(t("courses.courseRatingSaveFailed", "Failed to save your rating."));
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-5xl">🎓</span>
        <p className="text-lg font-semibold text-[var(--color-foreground)]">
          {t("courses.courseRatingThankYou", "Thank you for your rating!")}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t("courses.courseRatingRedirecting", "Redirecting to your certificate…")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stars */}
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
          {t("courses.courseRatingStarsLabel", "Your rating")}
          <span className="text-red-500 ms-1">*</span>
        </p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(value)}
              className={`text-4xl leading-none transition-transform hover:scale-110 focus:outline-none ${
                displayStars >= value ? "text-amber-400" : "text-[var(--color-border)]"
              }`}
              aria-label={fillMessage(t("courses.rateStarsAria", "Rate {n} stars"), { n: value })}
            >
              ★
            </button>
          ))}
          {stars > 0 && (
            <span className="ms-2 text-sm text-[var(--color-muted)]">
              {stars}/5
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
          {t("courses.courseRatingCommentLabel", "Your review (optional)")}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t("courses.courseRatingCommentPlaceholder", "Share your experience with this course…")}
          className="w-full resize-y rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <p className="mt-1 text-end text-xs text-[var(--color-muted)]">
          {comment.length}/2000
        </p>
      </div>

      {error && (
        <p className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || stars < 1}
        className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {busy
          ? t("courses.courseRatingSubmitting", "Submitting…")
          : t("courses.courseRatingSubmit", "Submit rating & get certificate")}
      </button>
    </form>
  );
}
