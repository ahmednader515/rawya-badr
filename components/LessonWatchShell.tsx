"use client";

import { VdoCipherPlayer } from "./VdoCipherPlayer";

type Props = {
  lessonId: string;
  videoId: string;
  className?: string;
  onVideoComplete?: () => void;
};

/** Lesson page wrapper around the VdoCipher secure player. */
export function LessonWatchShell({ lessonId, videoId, className = "w-full", onVideoComplete }: Props) {
  return (
    <div className="lesson-video-shell relative mt-6 w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-black">
      <VdoCipherPlayer
        key={`${lessonId}-${videoId}`}
        lessonId={lessonId}
        videoId={videoId}
        className={className}
        onVideoComplete={onVideoComplete}
      />
    </div>
  );
}
