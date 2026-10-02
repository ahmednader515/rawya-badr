"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./LocaleProvider";
import type { VdoCipherClientPayload } from "@/lib/vdocipher";
import { formatVdoCipherVideoId, normalizeVdoCipherVideoId } from "@/lib/vdocipher-video-id";
import { VdoCipherPreviewPlayer } from "./VdoCipherPreviewPlayer";

type LibraryVideo = {
  id: string;
  title: string;
  status: string;
  length: number | null;
  posterUrl: string | null;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

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

export function LessonVideoUpload({ videoId, lessonTitle, onVideoId, onVideoSaved, disabled }: Props) {
  const t = useT();
  const Cf = "dashboard.courseForm";
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryVideos, setLibraryVideos] = useState<LibraryVideo[]>([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryCount, setLibraryCount] = useState(0);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");

  const busy = phase === "uploading" || phase === "processing";
  const selectedId = normalizeVdoCipherVideoId(videoId) ?? "";

  async function loadLibrary(page: number, query: string, append: boolean) {
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/upload/video/library?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        videos?: LibraryVideo[];
        count?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || t(`${Cf}.videoLibraryLoadFailed`, "Could not load the video library."));
      const next = data.videos ?? [];
      setLibraryVideos((current) => (append ? [...current, ...next] : next));
      setLibraryCount(Number(data.count ?? next.length));
      setLibraryPage(page);
    } catch (err) {
      setLibraryError(
        err instanceof Error ? err.message : t(`${Cf}.videoLibraryLoadFailed`, "Could not load the video library."),
      );
    } finally {
      setLibraryLoading(false);
    }
  }

  useEffect(() => {
    if (!libraryOpen) return;
    const handle = window.setTimeout(() => {
      void loadLibrary(1, libraryQuery, false);
    }, 250);
    return () => window.clearTimeout(handle);
    // loadLibrary closes over latest translator; search debounce is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryOpen, libraryQuery]);

  function selectExistingVideo(id: string) {
    onVideoId(formatVdoCipherVideoId(id));
    setPhase("ready");
    setError("");
    setLibraryOpen(false);
    onVideoSaved?.();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError(t(`${Cf}.videoInvalidType`, "Please choose a video file"));
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

      onVideoId(formatVdoCipherVideoId(credData.videoId));
      setPhase("ready");
      setProgress(100);
      setLibraryOpen(false);
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
              onClick={() => setLibraryOpen(true)}
              className="text-sm text-[var(--color-primary)] hover:underline disabled:opacity-50"
            >
              {t(`${Cf}.videoChange`, "Change video")}
            </button>
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
      ) : (
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => setLibraryOpen(true)}
          className={`mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm ${
            busy || disabled ? "cursor-not-allowed opacity-60" : "hover:bg-[var(--color-border)]/40"
          }`}
        >
          {statusLabel()}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        disabled={busy || disabled}
        onChange={handleFileChange}
      />
      {phase === "uploading" && progress > 0 ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {libraryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-library-title"
          onClick={() => {
            if (!busy) setLibraryOpen(false);
          }}
        >
          <div
            className="flex max-h-[min(85vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <h3 id="video-library-title" className="text-lg font-semibold text-[var(--color-foreground)]">
                {t(`${Cf}.videoLibraryTitle`, "Video library")}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || disabled}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? statusLabel() : t(`${Cf}.uploadNewVideo`, "Upload new video")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setLibraryOpen(false)}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
                >
                  {t("dashboard.courseForm.cancelBtnShort", "Cancel")}
                </button>
              </div>
            </div>
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <input
                type="search"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder={t(`${Cf}.videoLibrarySearch`, "Search videos…")}
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {libraryError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{libraryError}</p>
              ) : null}
              {libraryLoading && libraryVideos.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">{t("common.loading", "Loading")}</p>
              ) : null}
              {!libraryLoading && !libraryError && libraryVideos.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  {t(`${Cf}.videoLibraryEmpty`, "No videos in your library yet.")}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {libraryVideos.map((video) => {
                  const selected = selectedId === video.id;
                  const duration = formatDuration(video.length);
                  return (
                    <button
                      key={video.id}
                      type="button"
                      disabled={busy || disabled}
                      onClick={() => selectExistingVideo(video.id)}
                      className={`overflow-hidden rounded-[var(--radius-btn)] border text-start transition ${
                        selected
                          ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                      }`}
                    >
                      <div className="relative aspect-video bg-[var(--color-background)]">
                        {video.posterUrl ? (
                          <img
                            src={video.posterUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted)]">
                            {video.status}
                          </div>
                        )}
                        {duration ? (
                          <span className="absolute bottom-1 end-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                            {duration}
                          </span>
                        ) : null}
                      </div>
                      <span className="line-clamp-2 px-2 py-2 text-xs text-[var(--color-foreground)]">
                        {video.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              {libraryVideos.length < libraryCount ? (
                <button
                  type="button"
                  disabled={libraryLoading}
                  onClick={() => void loadLibrary(libraryPage + 1, libraryQuery, true)}
                  className="mt-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50"
                >
                  {libraryLoading
                    ? t("common.loading", "Loading")
                    : t(`${Cf}.videoLibraryLoadMore`, "Load more")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
