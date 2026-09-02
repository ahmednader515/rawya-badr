"use client";

import { useRef, useState } from "react";
import { useT } from "./LocaleProvider";
import type { VdoCipherClientPayload } from "@/lib/vdocipher";
import { formatVdoCipherVideoId } from "@/lib/vdocipher-video-id";
import { VdoCipherPreviewPlayer } from "./VdoCipherPreviewPlayer";

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const STATUS_POLL_MS = 5000;
const STATUS_POLL_MAX = 120;

type UploadPhase = "idle" | "uploading" | "processing" | "ready" | "error";

type Props = {
  videoId: string;
  lessonTitle: string;
  onVideoId: (videoId: string) => void;
  onVideoSaved?: () => void;
  disabled?: boolean;
};

function uploadToVdoCipher(
  file: File,
  clientPayload: VdoCipherClientPayload,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", clientPayload.uploadLink);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201 || xhr.status === 200 || xhr.status === 204) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    const formData = new FormData();
    formData.append("policy", clientPayload.policy);
    formData.append("key", clientPayload.key);
    formData.append("x-amz-signature", clientPayload["x-amz-signature"]);
    formData.append("x-amz-algorithm", clientPayload["x-amz-algorithm"]);
    formData.append("x-amz-date", clientPayload["x-amz-date"]);
    formData.append("x-amz-credential", clientPayload["x-amz-credential"]);
    formData.append("success_action_status", "201");
    formData.append("success_action_redirect", "");
    formData.append("file", file);

    xhr.send(formData);
  });
}

async function pollVideoReady(videoId: string): Promise<void> {
  for (let i = 0; i < STATUS_POLL_MAX; i++) {
    const res = await fetch(
      `/api/upload/video/status?videoId=${encodeURIComponent(videoId)}`,
      { credentials: "include" },
    );
    const data = (await res.json()) as { status?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Failed to check video status");
    }
    const status = String(data.status ?? "").toLowerCase();
    if (status === "ready") return;
    if (status === "failed") {
      throw new Error("Video processing failed");
    }
    await new Promise((r) => setTimeout(r, STATUS_POLL_MS));
  }
  throw new Error("Video processing timed out");
}

export function LessonVideoUpload({ videoId, lessonTitle, onVideoId, onVideoSaved, disabled }: Props) {
  const t = useT();
  const Cf = "dashboard.courseForm";
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const busy = phase === "uploading" || phase === "processing";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError(t(`${Cf}.videoInvalidType`, "Please choose a video file"));
      setPhase("error");
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setError(t(`${Cf}.videoTooLarge`, "Video file is too large (max 2 GB)"));
      setPhase("error");
      return;
    }

    const title = lessonTitle.trim() || file.name.replace(/\.[^.]+$/, "") || "Lesson video";
    setError("");
    setProgress(0);
    setPhase("uploading");

    try {
      const credRes = await fetch("/api/upload/video/credentials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const credData = (await credRes.json()) as {
        videoId?: string;
        clientPayload?: VdoCipherClientPayload;
        error?: string;
      };
      if (!credRes.ok || !credData.videoId || !credData.clientPayload) {
        throw new Error(credData.error || t(`${Cf}.uploadFailedDetail`, "Upload failed"));
      }

      await uploadToVdoCipher(file, credData.clientPayload, setProgress);

      setPhase("processing");
      setProgress(100);
      await pollVideoReady(credData.videoId);

      onVideoId(formatVdoCipherVideoId(credData.videoId));
      setPhase("ready");
      onVideoSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(`${Cf}.uploadFailedDetail`, "Upload failed"));
      setPhase("error");
    }
  }

  function statusLabel(): string {
    if (phase === "uploading") {
      return t(`${Cf}.uploadingVideo`, "Uploading video…") + (progress > 0 ? ` ${progress}%` : "");
    }
    if (phase === "processing") {
      return t(`${Cf}.processingVideo`, "Processing video…");
    }
    if (phase === "ready" && videoId) {
      return t(`${Cf}.videoReady`, "Video ready");
    }
    return t(`${Cf}.chooseVideoUpload`, "Choose video");
  }

  return (
    <div>
      <label className="block text-xs text-[var(--color-muted)]">
        {t(`${Cf}.lessonVideoOptional`, "Lesson video (optional)")}
      </label>
      {videoId ? (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--color-primary)]">
              {t(`${Cf}.videoAttached`, "Video attached")}
            </span>
            <button
              type="button"
              disabled={busy || disabled}
              onClick={() => {
                onVideoId("");
                setPhase("idle");
                setError("");
              }}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              {t(`${Cf}.remove`, "Remove")}
            </button>
          </div>
          <VdoCipherPreviewPlayer key={videoId} videoId={videoId} />
        </div>
      ) : null}
      <label
        className={`mt-1 inline-block rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm ${
          busy || disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {statusLabel()}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          disabled={busy || disabled}
          onChange={handleFileChange}
        />
      </label>
      {phase === "uploading" && progress > 0 ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
