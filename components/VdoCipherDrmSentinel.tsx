"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildVdoCipherPlayerSrc,
  DRM_SENTINEL_OTP_REFRESH_LEAD_SECONDS,
  DRM_SENTINEL_OTP_TTL_SECONDS,
} from "@/lib/vdocipher";

function shouldRunDrmSentinel(
  authStatus: "loading" | "authenticated" | "unauthenticated",
  role: string | undefined,
): boolean {
  if (authStatus === "loading") return false;
  if (authStatus === "unauthenticated") return true;
  if (role === "STUDENT") return true;
  return false;
}

/**
 * Hidden muted VdoCipher player that keeps a Widevine session active for guests
 * and students on every public page, so external recorders are blocked early.
 */
export function VdoCipherDrmSentinel() {
  const { data: session, status } = useSession();
  const [src, setSrc] = useState("");
  const activeRef = useRef(false);
  const currentSrcRef = useRef("");
  const otpExpiresAtRef = useRef(0);
  const refreshTimeoutRef = useRef<number | null>(null);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const scheduleOtpRefresh = useCallback(() => {
    clearRefreshTimeout();
    if (otpExpiresAtRef.current === 0) return;

    const delayMs = Math.max(
      0,
      otpExpiresAtRef.current -
        Date.now() -
        DRM_SENTINEL_OTP_REFRESH_LEAD_SECONDS * 1000,
    );

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      void loadOtpRef.current?.();
    }, delayMs);
  }, [clearRefreshTimeout]);

  const loadOtpRef = useRef<(options?: { initial?: boolean }) => Promise<void>>(
    async () => {},
  );

  loadOtpRef.current = async (options?: { initial?: boolean }) => {
    if (!activeRef.current) return;

    const now = Date.now();
    if (!options?.initial && otpExpiresAtRef.current > now) {
      return;
    }

    try {
      const res = await fetch("/api/protection/drm-otp", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;

      const data = (await res.json()) as {
        otp?: string;
        playbackInfo?: string;
        ttl?: number;
      };
      if (!data.otp || !data.playbackInfo) return;

      const ttlSeconds = data.ttl ?? DRM_SENTINEL_OTP_TTL_SECONDS;
      const nextSrc = buildVdoCipherPlayerSrc(data.otp, data.playbackInfo, {
        autoplay: true,
        loop: true,
        controls: "off",
      });

      otpExpiresAtRef.current = now + ttlSeconds * 1000;

      if (nextSrc !== currentSrcRef.current) {
        currentSrcRef.current = nextSrc;
        setSrc(nextSrc);
      }

      scheduleOtpRefresh();
    } catch {
      // Sentinel is best-effort; fail silently.
    }
  };

  useEffect(() => {
    const role = session?.user?.role;
    const enabled = shouldRunDrmSentinel(status, role);
    activeRef.current = enabled;

    if (!enabled) {
      clearRefreshTimeout();
      currentSrcRef.current = "";
      otpExpiresAtRef.current = 0;
      setSrc("");
      return;
    }

    void loadOtpRef.current({ initial: true });

    return () => clearRefreshTimeout();
  }, [status, session?.user?.role, clearRefreshTimeout]);

  if (!src) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-50 h-px w-px overflow-hidden opacity-0"
    >
      <iframe
        src={src}
        className="h-px w-px border-0"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        title=""
      />
    </div>
  );
}
