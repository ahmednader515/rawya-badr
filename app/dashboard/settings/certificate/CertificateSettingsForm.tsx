"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CertificateView } from "@/components/CertificateView";
import { ImageAttachField } from "@/components/ImageAttachField";
import { useT } from "@/components/LocaleProvider";
import {
  CERTIFICATE_POSITION_DEFAULTS,
  parseCertificatePosition,
  type CertificateTemplate,
} from "@/lib/certificate-layout";

type Initial = {
  certificateBackgroundUrl: string;
  certificateNameTop: number;
  certificateNameLeft: number;
  certificateDateTop: number;
  certificateDateLeft: number;
};

function todayInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function PositionSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs tabular-nums text-[var(--color-muted)]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseCertificatePosition(e.target.value, value))}
        className="mt-1 w-full accent-[var(--color-primary)]"
      />
    </div>
  );
}

export function CertificateSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const t = useT();
  const F = "dashboard.certificateForm";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initial);
  const [previewStudentName, setPreviewStudentName] = useState(() => t(`${F}.previewStudentName`));
  const [previewDate, setPreviewDate] = useState(todayInputValue);

  const previewTemplate = useMemo<CertificateTemplate>(
    () => ({
      certificateBackgroundUrl: form.certificateBackgroundUrl || null,
      certificateNameTop: form.certificateNameTop,
      certificateNameLeft: form.certificateNameLeft,
      certificateDateTop: form.certificateDateTop,
      certificateDateLeft: form.certificateDateLeft,
    }),
    [form],
  );

  const previewIssuedAt = useMemo(() => {
    const parsed = new Date(`${previewDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [previewDate]);

  function setField<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetPositions() {
    setForm((current) => ({
      ...current,
      certificateNameTop: CERTIFICATE_POSITION_DEFAULTS.nameTop,
      certificateNameLeft: CERTIFICATE_POSITION_DEFAULTS.nameLeft,
      certificateDateTop: CERTIFICATE_POSITION_DEFAULTS.dateTop,
      certificateDateLeft: CERTIFICATE_POSITION_DEFAULTS.dateLeft,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings/certificate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t(`${F}.saveFailed`));
      setSuccess(t(`${F}.saveSuccess`));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(`${F}.saveFailed`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-6xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">{success}</div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t(`${F}.designHeading`)}
            </h3>
            <p className="text-sm text-[var(--color-muted)]">{t(`${F}.designHint`)}</p>

            <ImageAttachField
              value={form.certificateBackgroundUrl}
              onChange={(url) => setField("certificateBackgroundUrl", url)}
              label={t(`${F}.backgroundLabel`)}
              help={t(`${F}.backgroundHelp`)}
            />
          </div>

          <div className="space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                  {t(`${F}.positionHeading`)}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{t(`${F}.positionHint`)}</p>
              </div>
              <button
                type="button"
                onClick={resetPositions}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {t(`${F}.resetPositions`)}
              </button>
            </div>

            <div className="space-y-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{t(`${F}.namePosition`)}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PositionSlider
                  label={t(`${F}.verticalPosition`)}
                  value={form.certificateNameTop}
                  onChange={(value) => setField("certificateNameTop", value)}
                />
                <PositionSlider
                  label={t(`${F}.horizontalPosition`)}
                  value={form.certificateNameLeft}
                  onChange={(value) => setField("certificateNameLeft", value)}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{t(`${F}.datePosition`)}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PositionSlider
                  label={t(`${F}.verticalPosition`)}
                  value={form.certificateDateTop}
                  onChange={(value) => setField("certificateDateTop", value)}
                />
                <PositionSlider
                  label={t(`${F}.horizontalPosition`)}
                  value={form.certificateDateLeft}
                  onChange={(value) => setField("certificateDateLeft", value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t(`${F}.previewDataHeading`)}
            </h3>
            <p className="text-sm text-[var(--color-muted)]">{t(`${F}.previewDataHint`)}</p>

            <div>
              <label className="block text-sm font-medium">{t(`${F}.previewStudentLabel`)}</label>
              <input
                value={previewStudentName}
                onChange={(e) => setPreviewStudentName(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">{t(`${F}.previewDateLabel`)}</label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${F}.previewHeading`)}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t(`${F}.previewHint`)}</p>
          </div>
          <CertificateView
            studentName={previewStudentName.trim() || t(`${F}.previewStudentName`)}
            issuedAt={previewIssuedAt}
            template={previewTemplate}
          />
        </aside>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t(`${F}.saving`) : t(`${F}.save`)}
      </button>
    </form>
  );
}
