"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FawaterakPayLauncherProps = {
  labels: {
    amountLabel: string;
    amountPlaceholder: string;
    continueButton: string;
    minMaxHint: string;
  };
  minAmount: number;
  maxAmount: number;
  currencyShort: string;
  checkoutPath: string;
};

export function FawaterakPayLauncher({
  labels,
  minAmount,
  maxAmount,
  currencyShort,
  checkoutPath,
  title = "Fawaterak",
}: FawaterakPayLauncherProps & { title?: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < minAmount || value > maxAmount) {
      setError(labels.minMaxHint);
      return;
    }
    setError(null);
    router.push(`${checkoutPath}?amount=${encodeURIComponent(String(value))}`);
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{labels.minMaxHint}</p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {labels.amountLabel}
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={minAmount}
            max={maxAmount}
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            placeholder={labels.amountPlaceholder}
            className="w-full max-w-xs rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-muted)]">{currencyShort}</span>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!amount.trim()}
        className="mt-4 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {labels.continueButton}
      </button>
    </section>
  );
}
