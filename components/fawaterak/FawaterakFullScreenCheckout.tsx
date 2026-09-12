"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FawaterakPluginConfig } from "@/types/fawaterak.d";
import { formatFawaterakError } from "@/lib/fawaterak/format-error";

type SessionResponse = FawaterakPluginConfig & {
  pluginScriptUrl: string;
  depositId?: string;
  error?: unknown;
  code?: string;
  devLocalhost?: boolean;
};

type FawaterakFullScreenCheckoutProps = {
  amount: number;
  labels: {
    title: string;
    amountLabel: string;
    payButton: string;
    loading: string;
    backLink: string;
    errorGeneric: string;
    localhostWarning: string;
    preparing: string;
  };
  currencyShort: string;
  backHref: string;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment script"));
    document.body.appendChild(script);
  });
}

export function FawaterakFullScreenCheckout({
  amount,
  labels,
  currencyShort,
  backHref,
}: FawaterakFullScreenCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const startedRef = useRef(false);

  const startCheckout = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setError(null);
    setWarning(null);
    setLoading(true);
    setCheckoutReady(false);

    try {
      const res = await fetch("/api/payments/fawaterak/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          iframeDomain: window.location.origin,
        }),
      });

      const data = (await res.json()) as SessionResponse;
      if (!res.ok) {
        setError(formatFawaterakError(data.error, labels.errorGeneric));
        startedRef.current = false;
        return;
      }

      if (data.devLocalhost) {
        setWarning(labels.localhostWarning);
      }

      await loadScript(data.pluginScriptUrl);

      const config: FawaterakPluginConfig = {
        envType: data.envType,
        hashKey: data.hashKey,
        token: data.token,
        style: data.style ?? { listing: "horizontal" },
        version: data.version ?? "0",
        lang: (data.requestBody.lang as string) ?? "ar",
        redirectOutIframe: data.redirectOutIframe ?? true,
        requestBody: data.requestBody,
      };

      if (typeof window.fawaterkCheckout !== "function") {
        setError(labels.errorGeneric);
        startedRef.current = false;
        return;
      }

      window.fawaterkCheckout(config);
      setCheckoutReady(true);
    } catch {
      setError(labels.errorGeneric);
      startedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [amount, labels]);

  useEffect(() => {
    void startCheckout();
  }, [startCheckout]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={backHref}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {labels.backLink}
            </Link>
            <h1 className="mt-2 text-xl font-bold text-[var(--color-foreground)] sm:text-2xl">
              {labels.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {labels.amountLabel}:{" "}
              <span className="font-semibold text-[var(--color-foreground)]">
                {amount.toFixed(2)} {currencyShort}
              </span>
            </p>
          </div>
          {!checkoutReady && !error ? (
            <button
              type="button"
              onClick={() => void startCheckout()}
              disabled={loading}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? labels.loading : labels.payButton}
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        {warning ? (
          <p
            className="mb-4 rounded-[var(--radius-btn)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            {warning}
          </p>
        ) : null}

        {error ? (
          <div
            className="mb-4 rounded-[var(--radius-btn)] border-2 border-red-400 bg-red-50 px-4 py-4 dark:border-red-700 dark:bg-red-950/40"
            role="alert"
          >
            <p className="text-base font-semibold text-red-900 dark:text-red-100">{error}</p>
            <button
              type="button"
              onClick={() => {
                startedRef.current = false;
                void startCheckout();
              }}
              className="mt-3 rounded-[var(--radius-btn)] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {labels.payButton}
            </button>
          </div>
        ) : null}

        {loading && !checkoutReady ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-base font-medium text-[var(--color-muted)]">{labels.preparing}</p>
          </div>
        ) : null}

        <div
          id="fawaterkDivId"
          className={`w-full flex-1 ${checkoutReady ? "min-h-[calc(100vh-12rem)]" : "hidden"}`}
        />
      </main>
    </div>
  );
}
