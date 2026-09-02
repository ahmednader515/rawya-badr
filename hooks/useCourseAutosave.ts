"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CourseAutosaveBody } from "@/lib/course-content-save";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

type Options = {
  courseId?: string | null;
  getPayload: () => CourseAutosaveBody;
  enabled?: boolean;
  debounceMs?: number;
  forceDraft?: boolean;
  skipInitialLoad?: boolean;
  onDraftLoaded?: (draftId: string) => void;
};

export function useCourseAutosave({
  courseId: initialCourseId,
  getPayload,
  enabled = true,
  debounceMs = 1500,
  forceDraft = false,
  skipInitialLoad = false,
  onDraftLoaded,
}: Options) {
  const [courseId, setCourseId] = useState<string | null>(initialCourseId ?? null);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [draftLoaded, setDraftLoaded] = useState(Boolean(initialCourseId) || skipInitialLoad);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const getPayloadRef = useRef(getPayload);
  getPayloadRef.current = getPayload;

  useEffect(() => {
    if (initialCourseId) {
      setCourseId(initialCourseId);
      setDraftLoaded(true);
    }
  }, [initialCourseId]);

  const ensureCourseId = useCallback(async (forceNew = false): Promise<string | null> => {
    if (courseId && !forceNew) return courseId;
    const res = await fetch("/api/dashboard/courses/draft", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forceNew ? { forceNew: true } : {}),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      throw new Error(data.error || "Failed to create draft");
    }
    setCourseId(data.id);
    onDraftLoaded?.(data.id);
    return data.id;
  }, [courseId, onDraftLoaded]);

  const saveNow = useCallback(
    async (options?: { publish?: boolean; forceNew?: boolean; payload?: CourseAutosaveBody }) => {
      if (!enabled || savingRef.current) return null;
      savingRef.current = true;
      setStatus("saving");
      try {
        const id = await ensureCourseId(options?.forceNew);
        if (!id) throw new Error("No course id");

        const publish = options?.publish === true;
        const url = `/api/dashboard/courses/${encodeURIComponent(id)}/autosave${publish ? "?publish=1" : ""}`;
        const body = options?.payload ?? getPayloadRef.current();
        if (publish) body.isPublished = true;

        const res = await fetch(url, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Autosave failed");
        }
        setStatus("saved");
        return id;
      } catch (e) {
        setStatus("error");
        console.error("Course autosave failed:", e);
        return null;
      } finally {
        savingRef.current = false;
      }
    },
    [enabled, ensureCourseId],
  );

  const scheduleSave = useCallback(() => {
    if (!enabled || !draftLoaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, debounceMs);
  }, [debounceMs, draftLoaded, enabled, saveNow]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialCourseId || skipInitialLoad) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/courses/draft", { credentials: "include" });
        const data = (await res.json()) as { draft?: { id?: string } | null };
        if (cancelled) return;
        if (data.draft?.id) {
          setCourseId(String(data.draft.id));
          onDraftLoaded?.(String(data.draft.id));
        }
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCourseId, onDraftLoaded, skipInitialLoad]);

  return {
    courseId,
    status,
    draftLoaded,
    scheduleSave,
    saveNow,
    setCourseId,
  };
}
