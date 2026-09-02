"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildVdoCipherPlayerSrc } from "@/lib/vdocipher";
import { useT } from "./LocaleProvider";

type Props = {
  lessonId: string;
  videoId: string;
  className?: string;
  onVideoComplete?: () => void;
};

type PlayerState = "loading" | "ready" | "processing" | "error";

type VdoPlayerApi = {
  getInstance: (iframe: HTMLIFrameElement) => {
    video: {
      addEventListener: (event: string, handler: () => void) => void;
      removeEventListener: (event: string, handler: () => void) => void;
    };
  };
};

declare global {
  interface Window {
    VdoPlayer?: VdoPlayerApi;
  }
}

const VDO_API_SCRIPT = "https://player.vdocipher.com/v2/api.js";

function loadVdoCipherApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.VdoPlayer) return Promise.resolve();
  const existing = document.querySelector(`script[src="${VDO_API_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = VDO_API_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load VdoCipher API"));
    document.body.appendChild(script);
  });
}

export function VdoCipherPlayer({ lessonId, videoId, className = "w-full", onVideoComplete }: Props) {
  const t = useT();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const completeFiredRef = useRef(false);
  const onVideoCompleteRef = useRef(onVideoComplete);
  onVideoCompleteRef.current = onVideoComplete;

  const [playerKey, setPlayerKey] = useState(0);
  const [state, setState] = useState<PlayerState>("loading");
  const [error, setError] = useState("");
  const [src, setSrc] = useState("");

  const fireComplete = useCallback(() => {
    if (completeFiredRef.current) return;
    completeFiredRef.current = true;
    onVideoCompleteRef.current?.();
  }, []);

  const loadOtp = useCallback(async () => {
    completeFiredRef.current = false;
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

  useEffect(() => {
    if (state !== "ready" || !iframeRef.current || !onVideoCompleteRef.current) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadVdoCipherApi()
      .then(() => {
        if (cancelled || !iframeRef.current || !window.VdoPlayer) return;
        try {
          const player = window.VdoPlayer.getInstance(iframeRef.current);
          const onEnded = () => fireComplete();
          player.video.addEventListener("ended", onEnded);
          cleanup = () => player.video.removeEventListener("ended", onEnded);
        } catch {
          /* player not ready yet */
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [state, playerKey, fireComplete]);

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
