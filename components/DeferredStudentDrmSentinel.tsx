"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const VdoCipherDrmSentinel = dynamic(
  () => import("@/components/VdoCipherDrmSentinel").then((m) => m.VdoCipherDrmSentinel),
  { ssr: false },
);

/** Load the DRM sentinel after first paint so it does not compete with LCP. */
export function DeferredStudentDrmSentinel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => win.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <VdoCipherDrmSentinel />;
}
