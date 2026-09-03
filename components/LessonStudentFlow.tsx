"use client";

import { useCallback, useEffect, useState } from "react";
import { LessonWatchShell } from "@/components/LessonWatchShell";
import { LessonNavigationBar } from "@/components/LessonNavigationBar";
import { useT } from "@/components/LocaleProvider";

type NavItem =
  | { type: "lesson"; id: string; slug?: string | null; title: string }
  | { type: "quiz"; id: string; title: string };

type Props = {
  lessonId: string;
  videoId: string | null;
  initialWatchComplete: boolean;
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
  isLastLesson,
  certificateHref,
  prevItem,
  nextItem,
  prevHref,
  nextHref,
  children,
}: Props) {
  const t = useT();
  const hasVideo = Boolean(videoId);
  const [watchComplete, setWatchComplete] = useState(initialWatchComplete || !hasVideo);
  const [savingComplete, setSavingComplete] = useState(false);

  const persistComplete = useCallback(async () => {
    setSavingComplete(true);
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Failed to mark lesson complete:", res.status);
        return;
      }
      const data = await res.json() as { completed?: boolean };
      if (data.completed) setWatchComplete(true);
    } catch (err) {
      console.error("Error marking lesson complete:", err);
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
            {t("courses.watchToUnlockNextHint", "Watch the full lesson video to continue to the next lesson.")}
          </p>
          {savingComplete ? (
            <p className="mt-2 text-xs text-[var(--color-primary)]">
              {t("courses.savingProgress", "Saving your progress…")}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}

      <LessonNavigationBar
        prevItem={prevItem}
        nextItem={nextItem}
        prevHref={prevHref}
        nextHref={nextHref}
        watchComplete={watchComplete}
        isStudent
        isLastLesson={isLastLesson}
        certificateHref={watchComplete && isLastLesson ? certificateHref : null}
      />
    </>
  );
}
