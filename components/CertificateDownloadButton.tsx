"use client";

import { useT } from "@/components/LocaleProvider";

export function CertificateDownloadButton() {
  const t = useT();

  function handleDownload() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white shadow-[var(--shadow-card)] transition hover:bg-[var(--color-primary-hover)] print:hidden"
    >
      <span aria-hidden>📥</span>
      {t("courses.downloadCertificatePdf", "Download PDF")}
    </button>
  );
}
