"use client";

import { useEffect } from "react";
import { isMobilePhoneUserAgent, MOBILE_BLOCKED_PATH } from "@/lib/mobile-browser";

export function MobileBrowserGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === MOBILE_BLOCKED_PATH) return;
    if (isMobilePhoneUserAgent(navigator.userAgent)) {
      window.location.replace(MOBILE_BLOCKED_PATH);
    }
  }, []);

  return null;
}
