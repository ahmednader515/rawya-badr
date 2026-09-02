"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LessonWatchShell } from "@/components/LessonWatchShell";
import { LessonRatingSection } from "@/app/courses/[slug]/lessons/[lessonSlug]/LessonRatingSection";
import { LessonNavigationBar } from "@/components/LessonNavigationBar";
import { useT } from "@/components/LocaleProvider";

type NavItem =
  | { type: "lesson"; id: string; slug?: string | null; title: string }
  | { type: "quiz"; id: string; title: string };

type Props = {
  lessonId: string;
  videoId: string | null;
  initialWatchComplete: boolean;
  initialHasRated: boolean;
  isLastLesson: boolean;
  certificateHref: string | null;
  prevItem: NavItem | null;
  nextItem: NavItem | null;
  prevHref: string | null;
  nextHref: string | null;
  children?: React.ReactNode;
};

export function LessonStudentFlow({
  lessonId,
  videoId,
  initialWatchComplete,
  initialHasRated,
  isLastLesson,
  certificateHref,
  prevItem,
  nextItem,
  prevHref,
  nextHref,
  children,
}: Props) {
  const t = useT();
  const router = useRouter();
  const hasVideo = Boolean(videoId);
  const [watchComplete, setWatchComplete] = useState(initialWatchComplete || !hasVideo);
  const [hasRated, setHasRated] = useState(initialHasRated);
  const [savingComplete, setSavingComplete] = useState(false);

  const persistComplete = useCallback(async () => {
    setSavingComplete(true);
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) setWatchComplete(true);
    } finally {
      setSavingComplete(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!hasVideo && !initialWatchComplete) {
      void persistComplete();
    }
  }, [hasVideo, initialWatchComplete, persistComplete]);

  const handleVideoComplete = useCallback(() => {
    void persistComplete();
  }, [persistComplete]);

  const handleRated = useCallback(() => {
    setHasRated(true);
    router.refresh();
  }, [router]);

  return (
    <>
      {hasVideo && videoId ? (
        <LessonWatchShell
          lessonId={lessonId}
          videoId={videoId}
          onVideoComplete={handleVideoComplete}
        />
      ) : null}

      {!watchComplete && hasVideo ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <p className="text-sm text-[var(--color-muted)]">
            {t("courses.watchToRateHint", "Watch the full lesson video to unlock the rating step.")}
          </p>
          {savingComplete ? (
            <p className="mt-2 text-xs text-[var(--color-primary)]">
              {t("courses.savingProgress", "Saving your progress…")}
            </p>
          ) : null}
        </div>
      ) : null}

      {watchComplete ? (
        <LessonRatingSection
          lessonId={lessonId}
          mandatory
          onRated={handleRated}
        />
      ) : null}

      {children}

      <LessonNavigationBar
        prevItem={prevItem}
        nextItem={nextItem}
        prevHref={prevHref}
        nextHref={nextHref}
        hasRatedCurrent={hasRated}
        watchComplete={watchComplete}
        isStudent
        isLastLesson={isLastLesson}
        certificateHref={hasRated && isLastLesson ? certificateHref : null}
      />
    </>
  );
}
