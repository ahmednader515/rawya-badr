"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildVdoCipherPlayerSrc } from "@/lib/vdocipher";
import { useT } from "./LocaleProvider";

type Props = {
  lessonId: string;
  videoId: string;
  className?: string;
};

type PlayerState = "loading" | "ready" | "processing" | "error";

export function VdoCipherPlayer({ lessonId, videoId, className = "w-full" }: Props) {
  const t = useT();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [state, setState] = useState<PlayerState>("loading");
  const [error, setError] = useState("");
  const [src, setSrc] = useState("");

  const loadOtp = useCallback(async () => {
    setState("loading");
    setError("");
    setSrc("");

    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/video-otp`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        otp?: string;
        playbackInfo?: string;
        playerId?: string;
        status?: string;
        error?: string;
      };

      if (res.status === 409) {
        setState("processing");
        setError(
          t("video.processing", "Video is still processing. Please try again in a few minutes."),
        );
        return;
      }

      if (!res.ok || !data.otp || !data.playbackInfo) {
        throw new Error(data.error || t("video.loadFailed", "Failed to load video"));
      }

      setSrc(buildVdoCipherPlayerSrc(data.otp, data.playbackInfo, { playerId: data.playerId }));
      setPlayerKey((k) => k + 1);
      setState("ready");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : t("video.loadFailed", "Failed to load video"));
    }
  }, [lessonId, t]);

  useEffect(() => {
    void loadOtp();
  }, [loadOtp, videoId]);

  return (
    <div className={`relative aspect-video w-full bg-black ${className}`.trim()}>
      {state === "ready" && src ? (
        <iframe
          key={playerKey}
          ref={iframeRef}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allow="encrypted-media"
          allowFullScreen
          title={t("video.playerTitle", "Lesson video")}
        />
      ) : null}

      {state === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          {t("video.loading", "Loading video…")}
        </div>
      ) : null}

      {(state === "error" || state === "processing") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-white/90">{error}</p>
          <button
            type="button"
            onClick={() => void loadOtp()}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            {t("video.retry", "Retry")}
          </button>
        </div>
      )}
    </div>
  );
}
